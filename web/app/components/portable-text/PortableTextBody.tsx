import Image from "next/image";
import { PortableText, type PortableTextComponents } from "next-sanity";

import type { BlockContent } from "@/sanity.types";
import { urlFor } from "@/sanity/lib/image";

/**
 * The renderer for every `blockContent` field — lesson notes today, instructor
 * bios next. Content in Vertex is structured Portable Text, never markdown
 * (CLAUDE.md section 7), so this covers exactly the styles, lists, marks, and
 * members that `studio/schemaTypes/objects/blockContent.ts` allows.
 */
const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="mt-4 text-[15px] leading-[27px] text-neutral-700 first:mt-0">{children}</p>
    ),
    // The design puts a fixed "Overview" label above the notes, so an authored
    // heading sits one level below it in the visual hierarchy.
    h2: ({ children }) => (
      <h3 className="mt-8 font-display text-[18px] font-semibold leading-snug text-neutral-900 first:mt-0">
        {children}
      </h3>
    ),
    h3: ({ children }) => (
      <h4 className="mt-7 font-display text-[16px] font-semibold leading-snug text-neutral-900 first:mt-0">
        {children}
      </h4>
    ),
    h4: ({ children }) => (
      <h5 className="mt-6 text-[15px] font-semibold leading-snug text-neutral-900 first:mt-0">
        {children}
      </h5>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mt-5 border-l-2 border-accent pl-5 text-[15px] leading-[27px] text-neutral-700 italic">
        {children}
      </blockquote>
    ),
  },

  list: {
    bullet: ({ children }) => (
      <ul className="mt-4 list-disc space-y-2 pl-5 marker:text-neutral-300">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="mt-4 list-decimal space-y-2 pl-5 marker:text-neutral-500">{children}</ol>
    ),
  },

  listItem: {
    bullet: ({ children }) => (
      <li className="text-[15px] leading-[27px] text-neutral-700">{children}</li>
    ),
    number: ({ children }) => (
      <li className="text-[15px] leading-[27px] text-neutral-700">{children}</li>
    ),
  },

  marks: {
    strong: ({ children }) => (
      <strong className="font-semibold text-neutral-900">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="rounded-[4px] bg-neutral-100 px-1.5 py-0.5 font-mono text-[13px] text-neutral-900">
        {children}
      </code>
    ),
    link: ({ children, value }) => {
      const href: string = value?.href ?? "#";
      const isExternal = !href.startsWith("/");
      return (
        <a
          href={href}
          // Every outbound link is opened without handing the destination a
          // reference back to this window.
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noreferrer noopener" : undefined}
          className="text-accent underline underline-offset-2 transition-colors hover:brightness-90"
        >
          {children}
        </a>
      );
    },
  },

  types: {
    image: ({ value }) => {
      // `notes` is projected whole, so an inline image arrives as an
      // unresolved asset reference — no stored dimensions to read. The URL
      // builder works from the reference, and `h-auto` lets the real aspect
      // ratio win over the nominal size.
      if (!value?.asset) return null;
      return (
        <figure className="mt-6 overflow-hidden rounded-[10px] border border-line">
          <Image
            src={urlFor(value).width(1220).fit("max").auto("format").url()}
            alt={value.alt ?? ""}
            width={1220}
            height={686}
            sizes="(max-width: 1024px) 100vw, 610px"
            className="h-auto w-full"
          />
        </figure>
      );
    },
  },
};

export function PortableTextBody({ value }: { value: BlockContent }) {
  return <PortableText value={value} components={components} />;
}
