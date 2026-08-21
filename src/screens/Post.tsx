/*
 * JOURNAL POST (view: 'post') — one article.
 *
 * The article id lives in `store.post`; the Journal index sets it on the way
 * in. The comp rendered every binding as an empty string when that id was
 * missing, which produced a blank page with a stray quote mark — here a
 * missing or stale id gets a real empty state back to the index instead.
 */

import {
  Avatar,
  BackLink,
  Button,
  EmptyState,
  IconTile,
  PlaceholderTile,
} from "../components/index.ts";
import { data } from "../data/source.ts";
import {
  journalCategoryLabel,
  journalPost,
  journalReadLabel,
  relatedPosts,
  type JournalPost,
} from "../data/screens/blog.ts";
import { useT } from "../i18n/index.tsx";
import { firstName, formatMediumISO } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-post.css";

export default function Post() {
  const t = useT();
  const postId = useStore((s) => s.post);
  const set = useStore((s) => s.set);
  const go = useStore((s) => s.go);
  const startBooking = useStore((s) => s.startBooking);

  const post = journalPost(postId);

  const openPost = (id: string): void => {
    set({ post: id });
    go("post");
  };

  if (!post) {
    return (
      <main className="bk-screen bk-page scr-post">
        <BackLink onClick={() => go("blog")}>
          {t("screensB.post.back")}
        </BackLink>
        <EmptyState
          icon="book-open"
          title={t("screensB.post.emptyTitle")}
          body={t("screensB.post.emptyBody")}
          action={
            <Button onClick={() => go("blog")}>
              {t("screensB.post.browse")}
            </Button>
          }
        />
      </main>
    );
  }

  const author = data.getStaffMember(post.author);
  const related = relatedPosts(post.id);

  return (
    <main className="bk-screen bk-page scr-post">
      <BackLink onClick={() => go("blog")} className="scr-post__back">
        {t("screensB.post.back")}
      </BackLink>

      <div>
        <span className="bk-badge">{journalCategoryLabel(t, post.cat)}</span>
      </div>
      <h1 className="scr-post__title">{post.title}</h1>

      <div className="scr-post__byline">
        <Avatar
          initials={author?.initials ?? ""}
          tint={post.tint}
          size={38}
          fontSize={14}
          radius={19}
        />
        <div>
          <div className="scr-post__byline-name">{author?.name}</div>
          <div className="scr-post__byline-meta">
            {t("screensB.post.byline", {
              date: formatMediumISO(post.dateISO),
              read: journalReadLabel(t, post.readMin),
            })}
          </div>
        </div>
      </div>

      <PlaceholderTile
        tint={post.tint}
        icon={post.icon}
        iconSize={58}
        minHeight={250}
        angle="150deg"
        filename={post.fname}
        radius={20}
        bordered
        borderBlockEnd={false}
      />

      <div className="scr-post__body">
        {post.body.map((para, i) => (
          /* Paragraph order is the only identity a body line has. */
          <p key={i} className="scr-post__para">
            {para}
          </p>
        ))}
      </div>

      <blockquote className="scr-post__quote">“{post.quote}”</blockquote>

      {author ? (
        <aside className="scr-post__author">
          <Avatar
            initials={author.initials}
            tint={author.tint}
            size={52}
            fontSize={18}
            radius={26}
          />
          <div className="scr-post__author-copy">
            <div className="scr-post__author-name">{author.name}</div>
            <div className="scr-post__author-role">{author.role}</div>
            <div className="scr-post__author-bio">{author.bio}</div>
          </div>
          <Button icon="calendar-plus" iconSize={15} onClick={() => startBooking(null)}>
            {t("screensB.common.bookWith", { name: firstName(author.name) })}
          </Button>
        </aside>
      ) : null}

      <h2 className="scr-post__more">{t("screensB.post.more")}</h2>
      <div className="scr-post__related">
        {related.map((r) => (
          <RelatedCard key={r.id} post={r} onOpen={openPost} />
        ))}
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ *
 * "More from the journal" (local to this screen)
 * ------------------------------------------------------------------ */

interface RelatedCardProps {
  post: JournalPost;
  onOpen: (id: string) => void;
}

/* Same stretched-title pattern as the index: one focusable control per card,
 * named by the headline rather than by the whole card's text. */
function RelatedCard({ post, onOpen }: RelatedCardProps) {
  const t = useT();
  return (
    <article className="bk-card scr-post__rel">
      <IconTile icon={post.icon} tint={post.tint} size={44} iconSize={20} radius={15} />
      <div className="scr-post__rel-copy">
        <span className="scr-post__rel-cat">
          {journalCategoryLabel(t, post.cat)}
        </span>
        <h3 className="scr-post__rel-title">
          <button type="button" className="scr-post__open" onClick={() => onOpen(post.id)}>
            {post.title}
          </button>
        </h3>
        <span className="scr-post__rel-read">
          {journalReadLabel(t, post.readMin)}
        </span>
      </div>
    </article>
  );
}
