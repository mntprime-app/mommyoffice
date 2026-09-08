'use client';
/**
 * HeroWithModal — client wrapper around UniversalHero that wires the
 * "Дэлгэрэнгүй" secondary button to a Netflix-style detail modal.
 *
 * Usage (in server page.tsx):
 *   <HeroWithModal
 *     {...heroProps}
 *     secondaryActionText={cfg.hero_secondary_cta_text || undefined}
 *     relatedItems={homeVideos.slice(0,6).map(v => ({ ... }))}
 *     isMostLiked={cfg.hero_is_popular}
 *     year={cfg.hero_year}
 *     durationText={cfg.hero_duration_text}
 *   />
 *
 * Behaviour:
 *   - secondaryActionText is set   → button renders; click opens modal
 *   - secondaryActionText is empty → button does NOT render (no modal)
 */

import { useState } from 'react';
import UniversalHero, { type UniversalHeroProps } from '@/components/shared/UniversalHero';
import HeroDetailModal, { type RelatedItem } from '@/components/ui/HeroDetailModal';

type HeroWithModalProps = UniversalHeroProps & {
  /** Shows 🔴 "Хамгийн их үзэгдсэн" badge in the modal */
  isMostLiked?: boolean;
  /** e.g. "2026" */
  year?: string;
  /** e.g. "45 мин" or "3 цуврал" */
  durationText?: string;
  /** "More Like This" grid — pass related videos or courses */
  relatedItems?: RelatedItem[];
};

export default function HeroWithModal({
  secondaryActionText,
  // strip secondaryHref and onSecondaryClick — we always intercept with modal
  secondaryHref: _secondaryHref,
  onSecondaryClick: _onSecondaryClick,
  isMostLiked,
  year,
  durationText,
  relatedItems,
  ...heroProps
}: HeroWithModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasSecondary = !!secondaryActionText?.trim();

  return (
    <>
      <UniversalHero
        {...heroProps}
        secondaryActionText={hasSecondary ? secondaryActionText : undefined}
        secondaryHref={undefined}
        onSecondaryClick={hasSecondary ? () => setIsOpen(true) : undefined}
      />

      {hasSecondary && (
        <HeroDetailModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title={heroProps.title}
          description={heroProps.description}
          coverImage={heroProps.coverImage}
          youtubeId={heroProps.youtubeId}
          badgeText={heroProps.badgeText}
          primaryHref={heroProps.primaryHref}
          primaryActionText={heroProps.primaryActionText || 'ҮЗЭХ'}
          isMostLiked={isMostLiked}
          year={year}
          durationText={durationText}
          relatedItems={relatedItems}
        />
      )}
    </>
  );
}
