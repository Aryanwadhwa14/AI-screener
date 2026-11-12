"""
Production-Grade Dataset Seeding & Evaluation Pipeline
Runs deterministic ingestion, parsing, extraction, and dual-role scoring for all candidate resumes in data/.
Can be executed with:
    python backend/seed.py          # Runs ingestion & scoring
    python backend/seed.py --reset  # Resets SQLite database and re-runs from scratch
"""

import os
import sys
import glob
import argparse
from pathlib import Path

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.core.config import settings
from app.services.database import get_repository, reset_repository_for_testing
from app.services.storage import get_storage_service, reset_storage_for_testing
from app.services.ingestion.ingest import IngestionService, DuplicateResumeError
from app.services.ingestion.validator import FileValidationError
from app.services.extraction.pipeline import ExtractionPipelineService
from app.services.extraction.profile_service import ProfileExtractionService
from app.services.scoring.service import EvaluationService


def run_seeding(
    reset_db: bool = False,
    data_dir: str = "data",
    supabase_url: str = None,
    supabase_key: str = None,
):
    print("=" * 70)
    print("  Rankres ATS — Deterministic Pipeline Seeding & Scoring Engine")
    print("=" * 70)

    if supabase_url:
        settings.supabase_url = supabase_url
        os.environ["SUPABASE_URL"] = supabase_url
    if supabase_key:
        settings.supabase_service_role_key = supabase_key
        os.environ["SUPABASE_SERVICE_ROLE_KEY"] = supabase_key

    # Reset singletons if credentials were provided
    if supabase_url or supabase_key:
        reset_repository_for_testing(None)
        reset_storage_for_testing(None)

    repo = get_repository()
    storage = get_storage_service()

    backend_type = (
        "Cloud Supabase PostgreSQL"
        if "supabase" in type(repo).__name__.lower()
        else "Local SQLite"
    )
    storage_type = (
        "Cloud Supabase Bucket"
        if "supabase" in type(storage).__name__.lower()
        else "Local Filesystem"
    )
    print(f"  Target Database : {backend_type}")
    print(f"  Target Storage  : {storage_type}")
    print("=" * 70)

    # Resolve repo root and data dir
    repo_root = backend_dir.parent if backend_dir.name == "backend" else backend_dir
    resolved_data_dir = os.path.join(repo_root, data_dir)
    db_file = os.path.join(repo_root, "data", "app.db")

    if reset_db:
        if "sqlite" in type(repo).__name__.lower():
            print(f"\n[RESET] Removing local SQLite database at {db_file}...")
            if os.path.exists(db_file):
                try:
                    os.remove(db_file)
                    print("  -> Database removed successfully.")
                except Exception as e:
                    print(f"  -> Warning: Could not remove db file: {e}")
        else:
            print("\n[RESET] Note: Connected to Supabase. Seeding will upsert records.")

    ingestion = IngestionService(repository=repo, storage_service=storage)
    extraction = ExtractionPipelineService(repository=repo, storage_service=storage)
    profiling = ProfileExtractionService(repository=repo, storage_service=storage)
    scoring = EvaluationService(repository=repo, storage_service=storage)

    # 1. Discover all resume files
    docx_files = sorted(glob.glob(os.path.join(resolved_data_dir, "*.docx")))
    pdf_files = sorted(glob.glob(os.path.join(resolved_data_dir, "*.pdf")))
    all_files = docx_files + pdf_files

    print(f"\n[STEP 1/4] Discovered {len(all_files)} resumes in '{resolved_data_dir}'")
    if not all_files:
        print("  -> No .docx or .pdf files found to ingest. Exiting.")
        return

    # 2. Ingestion
    print("\n[STEP 2/4] Ingesting and deduplicating resumes...")
    ingested_candidates = []
    skipped_count = 0
    error_count = 0

    for idx, fpath in enumerate(all_files, 1):
        fname = os.path.basename(fpath)
        try:
            with open(fpath, "rb") as f:
                content = f.read()
            cand = ingestion.ingest_resume(content=content, original_filename=fname)
            ingested_candidates.append(cand)
            print(f"  [{idx:02d}/{len(all_files):02d}] Ingested {cand.candidate_code} ({fname})")
        except DuplicateResumeError:
            skipped_count += 1
            # Retrieve existing
            try:
                # Get candidate by filename if already exists
                existing_docs = repo.get_document_by_candidate_id
            except Exception:
                pass
        except FileValidationError as e:
            error_count += 1
            print(f"  [{idx:02d}/{len(all_files):02d}] Validation Error for {fname}: {e.message}")
        except Exception as e:
            error_count += 1
            print(f"  [{idx:02d}/{len(all_files):02d}] Failed {fname}: {e}")

    print(f"  -> Ingestion Complete: {len(ingested_candidates)} newly ingested, {skipped_count} duplicates skipped.")

    # 3. Text Extraction & Profile Extraction
    all_candidates = repo.list_candidates(limit=200)
    print(f"\n[STEP 3/4] Extracting text & structured profiles with evidence cross-referencing ({len(all_candidates)} candidates)...")

    for idx, cand in enumerate(all_candidates, 1):
        try:
            # Document text extraction
            extraction.process_candidate_document(cand.id)
            # Profile & evidence extraction
            profiling.extract_and_validate_profile(cand.id)
            print(f"  [{idx:02d}/{len(all_candidates):02d}] Profile parsed & verified for {cand.candidate_code}")
        except Exception as e:
            print(f"  [{idx:02d}/{len(all_candidates):02d}] Extraction note for {cand.candidate_code}: {e}")

    # 4. Deterministic Dual-Role Scoring
    print(f"\n[STEP 4/4] Evaluating candidates against JD1 (LCA) and JD2 (UI/UX)...")
    batch_res = scoring.evaluate_all_candidates()

    # Summary
    lca_rankings = scoring.get_role_rankings("LCA")
    uiux_rankings = scoring.get_role_rankings("UI_UX")

    lca_qualified = sum(1 for c in lca_rankings.rankings if c.is_qualified)
    uiux_qualified = sum(1 for c in uiux_rankings.rankings if c.is_qualified)

    print("\n" + "=" * 70)
    print("  EVALUATION SUMMARY REPORT")
    print("=" * 70)
    print(f"  Total Candidates Evaluated  : {batch_res.total_evaluated}")
    print(f"  LCA Specialist Qualified    : {batch_res.lca_qualified} (Benchmark >= 55%)")
    print(f"  UI/UX Designer Qualified    : {batch_res.uiux_qualified} (Benchmark >= 50%)")
    print(f"  Dual Match (Both Qualified) : {batch_res.both_qualified}")
    print(f"  Under Benchmark / Review    : {batch_res.neither_or_uncertain}")
    print("=" * 70)
    print("\nTop 3 LCA Candidates:")
    for rank_item in lca_rankings.rankings[:3]:
        print(f"  Rank #{rank_item.rank:02d}: {rank_item.candidate_code} — Score: {rank_item.score:.1f}% ({rank_item.qualification_status})")

    print("\nTop 3 UI/UX Candidates:")
    for rank_item in uiux_rankings.rankings[:3]:
        print(f"  Rank #{rank_item.rank:02d}: {rank_item.candidate_code} — Score: {rank_item.score:.1f}% ({rank_item.qualification_status})")
    print("=" * 70)
    print("Pipeline ready for review at http://localhost:3000\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed and evaluate candidate resumes.")
    parser.add_argument("--reset", action="store_true", help="Reset database before seeding")
    parser.add_argument("--data-dir", default="data", help="Directory containing resumes")
    parser.add_argument("--supabase-url", help="Supabase Project URL (e.g. https://xxx.supabase.co)")
    parser.add_argument("--supabase-key", help="Supabase service_role secret key")
    args = parser.parse_args()

    run_seeding(
        reset_db=args.reset,
        data_dir=args.data_dir,
        supabase_url=args.supabase_url,
        supabase_key=args.supabase_key,
    )
