"use client";
import { Code } from "@heroui/code";
import { Icon } from "@iconify/react";

export default function ScrollToRoadmapCode() {
  const handleScrollToRoadmap = () => {
    const el = document.getElementById('roadmap');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Code
      className="text-left w-fit flex items-center gap-2"
      onClick={handleScrollToRoadmap}
      style={{ cursor: 'pointer' }}
    >
      Check how far the vision goes <Icon icon="mdi:arrow-down" className="animate-bounce" />
    </Code>
  );
} 