'use client';
import { useState } from 'react';

interface Section {
  section: string;
  lessons: string[];
}

const SHOW_DEFAULT = 10;

export function CourseOutline({
  sections,
  lectureCount,
  durationText,
}: {
  sections: Section[];
  lectureCount: number;
  durationText: string;
}) {
  const [expandedAll, setExpandedAll] = useState(false);
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const visibleSections = showAll ? sections : sections.slice(0, SHOW_DEFAULT);
  const hiddenCount = sections.length - SHOW_DEFAULT;

  function toggleSection(i: number) {
    setOpenIndexes(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function toggleExpandAll() {
    if (expandedAll) {
      setOpenIndexes(new Set());
      setExpandedAll(false);
    } else {
      setOpenIndexes(new Set(sections.map((_, i) => i)));
      setExpandedAll(true);
      if (!showAll) setShowAll(true);
    }
  }

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
          {lectureCount > 0 && <span style={{ fontSize: '13px', color: '#888' }}>{lectureCount} хичээл</span>}
          {durationText && <span style={{ fontSize: '13px', color: '#888' }}>Нийт {durationText}</span>}
        </div>
        <button
          onClick={toggleExpandAll}
          style={{
            background: 'none', border: 'none', color: '#00B5AD',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            padding: '4px 0', textDecoration: 'underline',
          }}
        >
          {expandedAll ? 'Бүгдийг хураах' : 'Бүгдийг дэлгэх'}
        </button>
      </div>

      {/* Section list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {visibleSections.map((sec, i) => {
          const isOpen = openIndexes.has(i);
          return (
            <div key={i} style={{ border: '1px solid #2a2a2a', borderRadius: '8px', overflow: 'hidden' }}>
              {/* Section header */}
              <button
                onClick={() => toggleSection(i)}
                style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '11px 16px', cursor: 'pointer',
                  background: '#222', border: 'none', textAlign: 'left',
                  color: '#e5e5e5', fontSize: '14px', fontWeight: 600,
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                  {/* Arrow */}
                  <span style={{
                    fontSize: '11px', color: '#666', flexShrink: 0,
                    transition: 'transform 0.2s',
                    display: 'inline-block',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}>▼</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sec.section}</span>
                </div>
                <span style={{ fontSize: '12px', color: '#666', fontWeight: 400, flexShrink: 0 }}>
                  {sec.lessons?.length || 0} хичээл
                </span>
              </button>

              {/* Lessons */}
              {isOpen && (
                <div style={{ background: '#1a1a1a', padding: '4px 0' }}>
                  {(sec.lessons || []).map((lesson, j) => (
                    <div key={j} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 16px',
                      borderBottom: j < sec.lessons.length - 1 ? '1px solid #1f1f1f' : 'none',
                    }}>
                      <span style={{ color: '#444', fontSize: '12px', flexShrink: 0 }}>🔒</span>
                      <span style={{ fontSize: '13px', color: '#999' }}>{lesson}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show more button */}
      {!showAll && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          style={{
            marginTop: '12px', width: '100%',
            padding: '11px', border: '1px solid #2a2a2a',
            background: '#1a1a1a', color: '#ccc',
            borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {hiddenCount} нэмэлт хэсэг харуулах ▼
        </button>
      )}
      {showAll && sections.length > SHOW_DEFAULT && (
        <button
          onClick={() => setShowAll(false)}
          style={{
            marginTop: '12px', width: '100%',
            padding: '11px', border: '1px solid #2a2a2a',
            background: '#1a1a1a', color: '#ccc',
            borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Хураах ▲
        </button>
      )}
    </div>
  );
}
