'use client';
/**
 * HeroWithModal — client wrapper around UniversalHero that wires the
 * "Дэлгэрэнгүй" secondary button to a Netflix-style detail modal.
 *
 * Usage (in server page.tsx):
 *   <HeroWithModal
 *     {...heroProps}
 *     secondaryActionText={cfg.hero_secondary_cta_text || undefined}
 *   />
 *
 * Behaviour:
 *   - secondaryActionText is set   → button renders; click opens modal
 *   - secondaryActionText is empty → button does NOT render (no modal)
 *
 * The modal receives all the same data as the hero (title, description,
 * coverImage, youtubeId, badgeText, primaryHref, primaryActionText).
 * No extra DB fetch needed — data comes from mo_home_config via props.
 */

import { useState } from 'react';
import UniversalHero, { type UniversalHeroProps } from '@/components/shared/UniversalHero';
import HeroDetailModal from '@/components/ui/HeroDetailModal';

type HeroWithModalProps = UniversalHeroProps;

export default function HeroWithModal({
  secondaryActionText,
  // strip secondaryHref and onSecondaryClick — we always intercept with modal
  secondaryHref: _secondaryHref,
  onSecondaryClick: _onSecondaryClick,
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
        />
      )}
    </>
  );
}
