"use client";

import { Button } from "@/components/ui/button";

export function NextUngradedButton() {
  const handleClick = () => {
    const ungraded = Array.from(
      document.querySelectorAll<HTMLElement>('[data-submission-status="submitted"]')
    );
    if (ungraded.length === 0) return;

    const next =
      ungraded.find((el) => el.getBoundingClientRect().top > 0) ?? ungraded[0];

    next.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick}>
      Next ungraded
    </Button>
  );
}
