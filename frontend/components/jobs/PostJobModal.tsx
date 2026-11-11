'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconClose, IconBriefcase } from '@/components/ui/icons';

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  experienceLevel: string;
  skills: string[];
  benchmarkThreshold: number;
  description: string;
  applicantCount: number;
  createdAt: string;
}

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: (job: JobPosting) => void;
}

export default function PostJobModal({ isOpen, onClose, onJobCreated }: PostJobModalProps) {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [location, setLocation] = useState('Remote');
  const [experienceLevel, setExperienceLevel] = useState('1–3 years');
  const [skillsInput, setSkillsInput] = useState('');
  const [benchmarkThreshold, setBenchmarkThreshold] = useState('50');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Job title is required.');
      return;
    }

    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newJob: JobPosting = {
      id: `job-${Date.now()}`,
      title: title.trim(),
      department,
      location,
      experienceLevel,
      skills: skills.length > 0 ? skills : ['General'],
      benchmarkThreshold: parseInt(benchmarkThreshold, 10) || 50,
      description: description.trim() || 'Reviewing candidate resumes against role requirements.',
      applicantCount: 0,
      createdAt: 'Just now',
    };

    onJobCreated(newJob);
    // Reset and close
    setTitle('');
    setSkillsInput('');
    setDescription('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-xl border bg-card p-6 shadow-2xl text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <IconBriefcase size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Post a New Job</h3>
              <p className="text-xs text-muted-foreground">Create a position requisition for automated resume screening</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <IconClose size={15} />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {error && (
            <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Job Title <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="e.g. Full Stack Engineer, Sustainability Lead"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-input bg-transparent text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="Sustainability">Sustainability</option>
                <option value="Design">Product & Design</option>
                <option value="Engineering">Engineering</option>
                <option value="Data & AI">Data & AI</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Location / Work Mode</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-input bg-transparent text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="Remote">Remote</option>
                <option value="Onsite • Chennai">Onsite • Chennai</option>
                <option value="Onsite • Bangalore">Onsite • Bangalore</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-input bg-transparent text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="0–1 years">0–1 years (Entry/Intern)</option>
                <option value="1–3 years">1–3 years (Associate)</option>
                <option value="3–5 years">3–5 years (Mid-Senior)</option>
                <option value="5+ years">5+ years (Lead/Principal)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Pass Benchmark (%)</label>
              <Input
                type="number"
                min="30"
                max="90"
                value={benchmarkThreshold}
                onChange={(e) => setBenchmarkThreshold(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Required Skills & Competencies (comma separated)
            </label>
            <Input
              placeholder="e.g. React, TypeScript, Tailwind, Node.js"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              className="text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Job Summary (Optional)</label>
            <textarea
              rows={2}
              placeholder="Brief description of responsibilities and qualifications..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-md border border-input bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Publish Position
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

