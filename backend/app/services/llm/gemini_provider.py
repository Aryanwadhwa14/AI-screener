import json
import httpx
from app.services.llm.base import LLMProvider
from app.schemas.profile import CandidateProfile
from app.prompts.extraction_prompt import SYSTEM_INSTRUCTION, EXTRACTION_USER_PROMPT, PROMPT_VERSION


class GeminiProvider(LLMProvider):
    """
    Google Gemini provider for structured resume extraction.
    Uses strict system instructions and JSON response schema constraints.
    """

    def __init__(self, api_key: str, model_name: str = "gemini-2.0-flash"):
        self.api_key = api_key
        self._model_name = model_name
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"

    @property
    def provider_name(self) -> str:
        return "google_gemini"

    @property
    def model_name(self) -> str:
        return self._model_name

    def extract_profile(self, normalized_text: str, candidate_code: str) -> CandidateProfile:
        prompt_text = EXTRACTION_USER_PROMPT.format(
            candidate_code=candidate_code,
            resume_text=normalized_text,
        )

        schema = CandidateProfile.model_json_schema()

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt_text}],
                }
            ],
            "systemInstruction": {
                "parts": [{"text": SYSTEM_INSTRUCTION}]
            },
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": schema,
                "temperature": 0.0,
            },
        }

        with httpx.Client(timeout=45.0) as client:
            response = client.post(self.api_url, json=payload)
            if response.status_code != 200:
                raise RuntimeError(
                    f"Gemini API returned HTTP {response.status_code}: {response.text[:200]}"
                )

            data = response.json()
            raw_json = (
                data.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
            )

            if not raw_json:
                raise ValueError("Gemini returned empty structured output.")

            parsed_data = json.loads(raw_json)
            # Ensure candidate code matches
            parsed_data["candidate_code"] = candidate_code
            return CandidateProfile.model_validate(parsed_data)

