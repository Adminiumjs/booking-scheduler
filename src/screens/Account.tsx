/*
 * YOUR ACCOUNT (view: 'account') — revised comp, guest half.
 *
 * Everything on this screen edits `store.acct` live; "Save changes" is a toast
 * because there is nothing behind it, and the two destructive actions (add a
 * card, delete the account) are deliberately inert in the demo.
 */

import {
  Avatar,
  BackLink,
  Button,
  Card,
  Eyebrow,
  Field,
  Icon,
  Segmented,
  TextInput,
  Toggle,
} from "../components/index.ts";
import type { SegmentedOption } from "../components/index.ts";
import {
  ACCOUNT_FIELDS,
  ACCOUNT_TINT,
  CONTACT_OPTIONS,
  MEMBER_SINCE,
  SAVED_CARD,
} from "../data/screens/account.ts";
import type { AccountTextKey } from "../data/screens/account.ts";
import { data } from "../data/source.ts";
import type { AccountProfile } from "../data/types.ts";
import { initialsOf } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-account.css";

export default function Account() {
  const acct = useStore((s) => s.acct);
  const set = useStore((s) => s.set);
  const go = useStore((s) => s.go);
  const showToast = useStore((s) => s.showToast);

  const patch = (next: Partial<AccountProfile>): void =>
    set({ acct: { ...acct, ...next } });

  /* A computed key would widen the literal past `AccountProfile`, so the
   * write happens on a copy whose shape the compiler already knows. */
  const setText = (key: AccountTextKey, value: string): void => {
    const copy: AccountProfile = { ...acct };
    copy[key] = value;
    set({ acct: copy });
  };

  const prefOptions: SegmentedOption<string>[] = [
    { value: "any", label: "No preference" },
    ...data.getStaff().map((s) => ({ value: s.id, label: s.name })),
  ];
  /*
   * The store seeds `pref` with an id from the comp's own roster, which the
   * de-branding renamed. Anything the current roster no longer answers to
   * reads as "no preference" rather than leaving the row with nothing
   * selected; picking a specialist writes a live id, so it heals on first use.
   */
  const prefValue = prefOptions.some((o) => o.value === acct.pref)
    ? acct.pref
    : "any";

  const onTwofa = (next: boolean): void => {
    patch({ twofa: next });
    showToast(
      next ? "Two-step sign-in turned on" : "Two-step sign-in turned off",
      "ok",
    );
  };

  return (
    <section className="bk-screen bk-page scr-account">
      <BackLink onClick={() => go("dash")}>Back to dashboard</BackLink>

      <header className="scr-account__head">
        <h1 className="bk-h1">Account settings</h1>
        <p className="bk-sub">Your details, how we reach you, and how you pay.</p>
      </header>

      <Card padding="18px 20px" className="scr-account__identity">
        {/* Derived from the editable name so a rename is reflected here — the
         * comp hardcoded "AR". */}
        <Avatar
          initials={initialsOf(acct.name)}
          tint={ACCOUNT_TINT}
          size={60}
          fontSize={21}
          radius={30}
        />
        <div className="scr-account__who">
          <div className="scr-account__name">{acct.name}</div>
          <div className="scr-account__email">{acct.email}</div>
        </div>
        <span className="scr-account__member">
          <Icon name="gem" size={12} />
          {MEMBER_SINCE}
        </span>
      </Card>

      <Eyebrow className="scr-account__eyebrow">Personal details</Eyebrow>
      <div className="scr-account__fields">
        {ACCOUNT_FIELDS.map((f) => (
          <Field key={f.key} label={f.label}>
            {(control) => (
              <TextInput
                {...control}
                value={acct[f.key]}
                onChange={(v) => setText(f.key, v)}
                placeholder={f.placeholder}
              />
            )}
          </Field>
        ))}
      </div>

      <Eyebrow className="scr-account__eyebrow">Preferences</Eyebrow>
      <Card padding="18px 20px" className="scr-account__prefs">
        <div className="scr-account__prefblock">
          <span className="scr-account__preflabel">Preferred specialist</span>
          <Segmented
            label="Preferred specialist"
            options={prefOptions}
            value={prefValue}
            onChange={(v) => patch({ pref: v })}
          />
        </div>
        <div className="scr-account__prefblock">
          <span className="scr-account__preflabel">How we reach you first</span>
          <Segmented
            label="How we reach you first"
            options={CONTACT_OPTIONS}
            value={acct.contact}
            onChange={(v) => patch({ contact: v })}
          />
        </div>
      </Card>

      <div className="scr-account__saverow">
        <Button
          icon="check"
          size="lg"
          onClick={() => showToast("Account details saved", "ok")}
        >
          Save changes
        </Button>
        <span className="scr-account__savenote">
          Demo only — nothing leaves this page.
        </span>
      </div>

      <Eyebrow className="scr-account__eyebrow">Sign-in &amp; security</Eyebrow>
      <Card clip className="scr-account__sec">
        <div className="scr-account__secrow">
          <span className="scr-account__secicon">
            <Icon name="lock" size={16} />
          </span>
          <span className="scr-account__sectext">
            <span className="scr-account__sectitle">Password</span>
            <span className="scr-account__secdots bk-mono">••••••••••</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="scr-account__change"
            onClick={() =>
              showToast(`Password reset link sent to ${acct.email}`, "ok")
            }
          >
            Change
          </Button>
        </div>
        <div className="scr-account__secrow scr-account__secrow--last">
          <span className="scr-account__secicon">
            <Icon name="shield-check" size={16} />
          </span>
          <span className="scr-account__sectext">
            <span className="scr-account__sectitle">Two-step sign-in</span>
            <span className="scr-account__secsub">
              Text a code when signing in on a new device.
            </span>
          </span>
          <Toggle
            checked={acct.twofa}
            onChange={onTwofa}
            label="Two-step sign-in"
          />
        </div>
      </Card>

      <Eyebrow className="scr-account__eyebrow">Payment method</Eyebrow>
      <Card padding="16px 18px" className="scr-account__pay">
        <span className="scr-account__paytile">
          <Icon name="credit-card" size={18} />
        </span>
        <span className="scr-account__sectext">
          <span className="scr-account__sectitle">{SAVED_CARD.label}</span>
          <span className="scr-account__secsub">{SAVED_CARD.meta}</span>
        </span>
        <span className="scr-account__default">Default</span>
      </Card>

      <div className="scr-account__addrow">
        <Button
          variant="ghost"
          icon="plus"
          iconSize={15}
          className="scr-account__add"
          onClick={() => showToast("Card entry is demo-only", "warn")}
        >
          Add a payment method
        </Button>
      </div>

      <div className="scr-account__danger">
        <div className="scr-account__dangertext">
          <div className="scr-account__dangertitle">Close your account</div>
          <div className="scr-account__dangerbody">
            Removes your profile, points and saved cards. Upcoming visits are
            cancelled.
          </div>
        </div>
        {/* `danger` rather than `ghost` so it gets the `.bk-btn` press
         * behaviour the comp gave it; the outline treatment is below. */}
        <Button
          variant="danger"
          className="scr-account__delete"
          onClick={() =>
            showToast("Account deletion is disabled in the demo", "warn")
          }
        >
          Delete account
        </Button>
      </div>
    </section>
  );
}
