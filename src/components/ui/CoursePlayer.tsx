'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Lesson {
  title: string;
  sectionIndex: number;
  lessonIndex: number;
  globalIndex: number;
}

interface Section {
  section: string;
  lessons: string[];
}

interface CoursePlayerProps {
  locale: string;
  slug: string;
  title: string;
  videoId: string;
  sections: Section[];
  instructorName: string;
  instructorSlug: string;
}

function buildLessons(sections: Section[]): Lesson[] {
  const all: Lesson[] = [];
  let g = 0;
  sections.forEach((sec, si) => {
    (sec.lessons || []).forEach((l, li) => {
      all.push({ title: l, sectionIndex: si, lessonIndex: li, globalIndex: g++ });
    });
  });
  return all;
}

function storageKey(slug: string) {
  return `mo_progress_${slug}`;
}

function loadCompleted(slug: string): Set<number> {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch { return new Set(); }
}

function saveCompleted(slug: string, set: Set<number>) {
  try {
    localStorage.setItem(storageKey(slug), JSON.stringify([...set]));
  } catch { /* ignore */ }
}

export function CoursePlayer({
  locale, slug, title, videoId, sections, instructorName, instructorSlug,
}: CoursePlayerProps) {
  const allLessons = buildLessons(sections);
  const total = allLessons.length;

  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [openSections, setOpenSections] = useState<Set<number>>(new Set(sections.map((_, i) => i)));
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);

  useEffect(() => {
    setCompleted(loadCompleted(slug));
  }, [slug]);

  function toggleLesson(globalIdx: number) {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(globalIdx)) next.delete(globalIdx);
      else next.add(globalIdx);
      saveCompleted(slug, next);
      return next;
    });
  }

  function toggleSection(i: number) {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function goToLesson(idx: number) {
    if (idx >= 0 && idx < total) setActiveLessonIdx(idx);
  }

  function markAndNext() {
    if (!completed.has(activeLessonIdx)) toggleLesson(activeLessonIdx);
    if (activeLessonIdx < total - 1) setActiveLessonIdx(activeLessonIdx + 1);
  }

  const doneCount = completed.size;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const activeLesson = allLessons[activeLessonIdx];

  return (
    <div style={{ minHeight: '100vh', background: '#111' }}>

      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(15,15,15,0.97)',
        borderBottom: '1px solid #1f1f1f',
        padding: '0 1.5rem',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        height: '52px', gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <Link href={`/${locale}/courses/${slug}`}
            style={{ color: '#666', textDecoration: 'none', fontSize: '13px', flexShrink: 0 }}>
            ← Буцах
          </Link>
          <span style={{ color: '#333' }}>|</span>
          <span style={{
            fontSize: '14px', fontWeight: 600, color: '#e5e5e5',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{title}</span>
        </div>
        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ width: '120px', height: '4px', background: '#2a2a2a', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: '#00B5AD', transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap' }}>
            {doneCount}/{total} ({pct}%)
          </span>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: 'flex', height: 'calc(100vh - 52px)' }}>

        {/* Video + controls */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>

          {/* Video */}
          <div style={{
            position: 'relative', width: '100%',
            background: '#000',
            aspectRatio: '16 / 9',
          }}>
            {videoId ? (
              <iframe
                key={videoId}
                src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                title={title}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              />
            ) : (
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: '#0a0a0a',
              }}>
                <span style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</span>
                <p style={{ color: '#555', fontSize: '15px', fontWeight: 600, margin: 0 }}>
                  Видео удахгүй нэмэгдэх болно
                </p>
              </div>
            )}
          </div>

          {/* Lesson nav bar */}
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid #1f1f1f',
            display: 'flex', alignItems: 'flex-start',
            justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap',
          }}>
            <div style={{ minWidth: 0 }}>
              {activeLesson && (
                <>
                  <p style={{ fontSize: '11px', color: '#666', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {sections[activeLesson.sectionIndex]?.section}
                  </p>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e5e5e5', margin: 0 }}>
                    {activeLesson.title}
                  </h2>
                </>
              )}
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#666' }}>Багш:</span>
                <Link href={`/${locale}/instructors/${instructorSlug}`}
                  style={{ fontSize: '13px', color: '#00B5AD', textDecoration: 'none', fontWeight: 600 }}>
                  {instructorName}
                </Link>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button
                onClick={() => goToLesson(activeLessonIdx - 1)}
                disabled={activeLessonIdx === 0}
                style={{
                  padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                  background: 'none', border: '1px solid #333', color: activeLessonIdx === 0 ? '#444' : '#aaa',
                  cursor: activeLessonIdx === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                ← Өмнөх
              </button>
              <button
                onClick={markAndNext}
                style={{
                  padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700,
                  background: '#00B5AD', border: 'none', color: '#fff', cursor: 'pointer',
                }}
              >
                {activeLessonIdx === total - 1 ? '✓ Дуусгах' : 'Дараагийнх →'}
              </button>
            </div>
          </div>

          {/* Completion certificate teaser (if 100%) */}
          {pct === 100 && (
            <div style={{
              margin: '20px 24px',
              background: 'linear-gradient(135deg, #00B5AD22, #00B5AD11)',
              border: '1px solid rgba(0,181,173,0.4)',
              borderRadius: '12px', padding: '20px 24px',
              display: 'flex', alignItems: 'center', gap: '16px',
            }}>
              <span style={{ fontSize: '36px' }}>🎓</span>
              <div>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#00B5AD', margin: '0 0 4px' }}>
                  Баяр хүргэе! Та сургалтыг амжилттай дүүргэлээ.
                </p>
                <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
                  Гэрчилгээ удахгүй нэмэгдэх болно.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Curriculum sidebar */}
        <div style={{
          width: '340px', flexShrink: 0,
          borderLeft: '1px solid #1f1f1f',
          background: '#111',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid #1f1f1f',
            position: 'sticky', top: 0, background: '#111', zIndex: 2,
          }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#e5e5e5', margin: 0 }}>
              Сургалтын агуулга
            </p>
          </div>

          {sections.map((sec, si) => {
            const isOpen = openSections.has(si);
            const secLessons = allLessons.filter(l => l.sectionIndex === si);
            const secDone = secLessons.filter(l => completed.has(l.globalIndex)).length;
            return (
              <div key={si} style={{ borderBottom: '1px solid #1a1a1a' }}>
                {/* Section header */}
                <button
                  onClick={() => toggleSection(si)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '12px 16px',
                    background: '#161616', border: 'none', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#ccc', margin: '0 0 2px', lineHeight: 1.3 }}>
                      {sec.section}
                    </p>
                    <p style={{ fontSize: '11px', color: '#555', margin: 0 }}>
                      {secDone}/{secLessons.length} дүүргэсэн
                    </p>
                  </div>
                  <span style={{
                    fontSize: '10px', color: '#555', flexShrink: 0,
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s', display: 'inline-block',
                  }}>▼</span>
                </button>

                {/* Lessons */}
                {isOpen && secLessons.map(lesson => {
                  const isActive = lesson.globalIndex === activeLessonIdx;
                  const isDone = completed.has(lesson.globalIndex);
                  return (
                    <button
                      key={lesson.globalIndex}
                      onClick={() => setActiveLessonIdx(lesson.globalIndex)}
                      style={{
                        width: '100%', textAlign: 'left',
                        padding: '10px 16px 10px 20px',
                        background: isActive ? 'rgba(0,181,173,0.08)' : 'transparent',
                        border: 'none', cursor: 'pointer',
                        borderLeft: isActive ? '3px solid #00B5AD' : '3px solid transparent',
                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                      }}
                    >
                      {/* Checkbox */}
                      <span
                        onClick={e => { e.stopPropagation(); toggleLesson(lesson.globalIndex); }}
                        style={{
                          width: '16px', height: '16px', borderRadius: '3px', flexShrink: 0,
                          marginTop: '1px',
                          border: isDone ? 'none' : '1.5px solid #444',
                          background: isDone ? '#00B5AD' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'background 0.15s',
                        }}
                      >
                        {isDone && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: isActive ? '#00B5AD' : isDone ? '#666' : '#aaa',
                        lineHeight: 1.4, fontWeight: isActive ? 600 : 400,
                      }}>
                        {lesson.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
