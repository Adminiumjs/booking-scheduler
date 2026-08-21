/*
 * STUDIO JOURNAL (view: 'blog') — the article index.
 *
 * One featured post leads the unfiltered list; picking a category drops the
 * feature and shows every matching post in the grid instead, so a section is
 * never missing its own lead article.
 *
 * The comp made each card a single `<button>` wrapping the tile, the excerpt
 * and the byline, which gives the control an accessible name several
 * sentences long. Here the card is an `<article>` and only the title is the
 * button, stretched over the card with a pseudo-element — same click target,
 * a name a screen reader can actually use.
 */

import {
  Avatar,
  Chip,
  EmptyState,
  PlaceholderTile,
  TextInput,
} from "../components/index.ts";
import { data } from "../data/source.ts";
import {
  JOURNAL_CATEGORIES,
  journalCategoryLabel,
  journalReadLabel,
  POSTS,
  type JournalFilter,
  type JournalPost,
} from "../data/screens/blog.ts";
import { useT } from "../i18n/index.tsx";
import { formatMediumISO } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-blog.css";

export default function Blog() {
  const t = useT();
  const blogCat = useStore((s) => s.blogCat);
  const blogEmail = useStore((s) => s.blogEmail);
  const set = useStore((s) => s.set);
  const go = useStore((s) => s.go);
  const showToast = useStore((s) => s.showToast);

  const matching = POSTS.filter((p) => blogCat === "all" || p.cat === blogCat);
  const featured = blogCat === "all" ? (matching.find((p) => p.featured) ?? null) : null;
  const rest = featured ? matching.filter((p) => p.id !== featured.id) : matching;

  /** "All" plus every section, in the comp's order. */
  const filters: readonly { value: JournalFilter; label: string }[] = [
    { value: "all", label: t("screensA.common.all") },
    ...JOURNAL_CATEGORIES.map((c) => ({
      value: c,
      label: journalCategoryLabel(t, c),
    })),
  ];

  const openPost = (id: string): void => {
    set({ post: id });
    go("post");
  };

  const subscribe = (): void => {
    /* The comp's own loose check — a demo newsletter, not a signup form. */
    if (blogEmail.trim().indexOf("@") < 1) {
      showToast(t("screensA.blog.needEmail"), "warn");
      return;
    }
    set({ blogEmail: "" });
    showToast(t("screensA.blog.subscribed"), "ok");
  };

  return (
    <main className="bk-screen bk-page scr-blog">
      <div className="scr-blog__head">
        <h1 className="bk-h1">{t("screensA.blog.title")}</h1>
        <p className="bk-sub scr-blog__lede">{t("screensA.blog.lede")}</p>
      </div>

      <div className="scr-blog__filters">
        {filters.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            active={blogCat === f.value}
            onClick={() => set({ blogCat: f.value })}
          />
        ))}
      </div>

      {featured ? <FeaturedCard post={featured} onOpen={openPost} /> : null}

      {rest.length === 0 ? (
        <EmptyState
          icon="book-open"
          title={t("screensA.blog.emptyTitle")}
          body={t("screensA.blog.emptyBody")}
        />
      ) : (
        <div className="scr-blog__grid">
          {rest.map((p) => (
            <PostCard key={p.id} post={p} onOpen={openPost} />
          ))}
        </div>
      )}

      <section className="scr-blog__news">
        <div className="scr-blog__news-copy">
          <div className="scr-blog__news-title">{t("screensA.blog.newsTitle")}</div>
          <div className="scr-blog__news-sub">{t("screensA.blog.newsSub")}</div>
        </div>
        <div className="scr-blog__news-form">
          <TextInput
            value={blogEmail}
            onChange={(v) => set({ blogEmail: v })}
            type="email"
            inputMode="email"
            placeholder="you@email.com"
            ariaLabel={t("screensA.blog.emailAria")}
          />
          <button
            type="button"
            className="bk-btn scr-blog__subscribe"
            onClick={subscribe}
          >
            {t("screensA.blog.subscribe")}
          </button>
        </div>
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ *
 * Cards (local to this screen)
 * ------------------------------------------------------------------ */

interface CardProps {
  post: JournalPost;
  onOpen: (id: string) => void;
}

function FeaturedCard({ post, onOpen }: CardProps) {
  const t = useT();
  const author = data.getStaffMember(post.author);

  return (
    <article className="bk-card scr-blog__feat">
      <PlaceholderTile
        tint={post.tint}
        icon={post.icon}
        iconSize={60}
        minHeight={260}
        angle="150deg"
        filename={post.fname}
      />
      <div className="scr-blog__feat-body">
        <span className="bk-badge">{journalCategoryLabel(t, post.cat)}</span>
        <h2 className="scr-blog__feat-title">
          <button type="button" className="scr-blog__open" onClick={() => onOpen(post.id)}>
            {post.title}
          </button>
        </h2>
        <p className="scr-blog__feat-excerpt">{post.excerpt}</p>
        <div className="scr-blog__byline">
          <Avatar
            initials={author?.initials ?? ""}
            tint={post.tint}
            size={30}
            fontSize={11}
            radius={15}
            className="scr-blog__avatar"
          />
          <span>
            <span className="scr-blog__byline-name">{author?.name}</span>
            <span className="scr-blog__byline-meta">
              {formatMediumISO(post.dateISO)} · {journalReadLabel(t, post.readMin)}
            </span>
          </span>
        </div>
      </div>
    </article>
  );
}

function PostCard({ post, onOpen }: CardProps) {
  const t = useT();
  const author = data.getStaffMember(post.author);

  return (
    <article className="bk-card scr-blog__post">
      <PlaceholderTile
        tint={post.tint}
        icon={post.icon}
        iconSize={40}
        minHeight={150}
        filename={post.fname}
      />
      <div className="scr-blog__post-body">
        <span className="bk-badge">{journalCategoryLabel(t, post.cat)}</span>
        <h2 className="scr-blog__post-title">
          <button type="button" className="scr-blog__open" onClick={() => onOpen(post.id)}>
            {post.title}
          </button>
        </h2>
        <p className="scr-blog__post-excerpt">{post.excerpt}</p>
        <div className="scr-blog__byline">
          <Avatar
            initials={author?.initials ?? ""}
            tint={post.tint}
            size={26}
            fontSize={10}
            radius={13}
            className="scr-blog__avatar"
          />
          <span className="scr-blog__byline-meta scr-blog__byline-meta--inline">
            {author?.name} · {formatMediumISO(post.dateISO)} ·{" "}
            {journalReadLabel(t, post.readMin)}
          </span>
        </div>
      </div>
    </article>
  );
}
