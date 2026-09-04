"use client";

import { ArrowRight } from "lucide-react";
import posthog from "posthog-js";
import { Button } from "../ui/Button";
import { TextInput } from "../ui/Input";

export function Hero() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto w-full max-w-[904px] px-5 pb-14 pt-14 text-center sm:px-6 sm:pt-[68px]">
        <p className="inline-flex h-[38px] items-center rounded-full border border-line bg-surface px-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">
          Intelligent Learning
        </p>

        <h1 className="mx-auto mt-6 max-w-[620px] font-display text-[38px] font-semibold leading-[1.1] tracking-[-0.01em] text-neutral-900 sm:text-[48px] lg:text-[62px] lg:leading-[70px]">
          Search your learning in plain English.
        </h1>

        <p className="mx-auto mt-7 max-w-[460px] text-[17px] leading-[29px] text-neutral-700 lg:text-[19px] lg:leading-[33px]">
          Vertex understands what you want to learn and finds the exact lessons
          across all your courses.
        </p>

        <div className="mt-7 flex justify-center">
          <Button
            variant="accent"
            size="lg"
            icon={<ArrowRight size={20} strokeWidth={2} />}
            onClick={() => posthog.capture("explore_courses_clicked")}
          >
            Explore Courses
          </Button>
        </div>

        <div className="mx-auto mt-10 max-w-[746px]">
          <label htmlFor="home-search" className="sr-only">
            Ask anything about your learning
          </label>
          <TextInput
            id="home-search"
            inputSize="lg"
            shortcut="⌘ K"
            placeholder="Ask anything about your learning..."
          />
        </div>
      </div>
    </section>
  );
}
