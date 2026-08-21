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
  MEMBER_SINCE_ISO,
  SAVED_CARD,
} from "../data/screens/account.ts";
import type { AccountTextKey } from "../data/screens/account.ts";
import { data } from "../data/source.ts";
import type { AccountProfile } from "../data/types.ts";
import { useI18n } from "../i18n/index.tsx";
import { initialsOf, parseISO } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-account.css";

export default function Account() {
  const { t, date } = useI18n();
  /* Month + year, spelled the reader's way: "Mar 2024", "März 2024", "٣‏/٢٠٢٤". */
  const memberSince = date(parseISO(MEMBER_SINCE_ISO), {
    month: "short",
    year: "numeric",
  });
  const contactOptions = CONTACT_OPTIONS.map((o) => ({
    value: o.value,
    label: t(o.labelKey),
  }));
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
    { value: "any", label: t("screensA.account.noPreference") },
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
      t(next ? "screensA.account.twofaOn" : "screensA.account.twofaOff"),
      "ok",
    );
  };

  return (
    <section className="bk-screen bk-page scr-account">
      <BackLink onClick={() => go("dash")}>
        {t("screensA.common.backToDashboard")}
      </BackLink>

      <header className="scr-account__head">
        <h1 className="bk-h1">{t("screensA.account.title")}</h1>
        <p className="bk-sub">{t("screensA.account.sub")}</p>
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
          {t("screensA.account.memberSince", { date: memberSince })}
        </span>
      </Card>

      <Eyebrow className="scr-account__eyebrow">
        {t("screensA.account.personal")}
      </Eyebrow>
      <div className="scr-account__fields">
        {ACCOUNT_FIELDS.map((f) => (
          <Field key={f.key} label={t(f.labelKey)}>
            {(control) => (
              <TextInput
                {...control}
                value={acct[f.key]}
                onChange={(v) => setText(f.key, v)}
                placeholder={
                  f.placeholderKey ? t(f.placeholderKey) : f.placeholder
                }
              />
            )}
          </Field>
        ))}
      </div>

      <Eyebrow className="scr-account__eyebrow">
        {t("screensA.account.preferences")}
      </Eyebrow>
      <Card padding="18px 20px" className="scr-account__prefs">
        <div className="scr-account__prefblock">
          <span className="scr-account__preflabel">
            {t("screensA.account.preferredSpecialist")}
          </span>
          <Segmented
            label={t("screensA.account.preferredSpecialist")}
            options={prefOptions}
            value={prefValue}
            onChange={(v) => patch({ pref: v })}
          />
        </div>
        <div className="scr-account__prefblock">
          <span className="scr-account__preflabel">
            {t("screensA.account.contactFirst")}
          </span>
          <Segmented
            label={t("screensA.account.contactFirst")}
            options={contactOptions}
            value={acct.contact}
            onChange={(v) => patch({ contact: v })}
          />
        </div>
      </Card>

      <div className="scr-account__saverow">
        <Button
          icon="check"
          size="lg"
          onClick={() => showToast(t("screensA.account.saved"), "ok")}
        >
          {t("screensA.common.saveChanges")}
        </Button>
        <span className="scr-account__savenote">
          {t("screensA.account.saveNote")}
        </span>
      </div>

      <Eyebrow className="scr-account__eyebrow">
        {t("screensA.account.security")}
      </Eyebrow>
      <Card clip className="scr-account__sec">
        <div className="scr-account__secrow">
          <span className="scr-account__secicon">
            <Icon name="lock" size={16} />
          </span>
          <span className="scr-account__sectext">
            <span className="scr-account__sectitle">
              {t("screensA.account.password")}
            </span>
            <span className="scr-account__secdots bk-mono">••••••••••</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="scr-account__change"
            onClick={() =>
              showToast(
                t("screensA.account.resetSent", { email: acct.email }),
                "ok",
              )
            }
          >
            {t("screensA.account.change")}
          </Button>
        </div>
        <div className="scr-account__secrow scr-account__secrow--last">
          <span className="scr-account__secicon">
            <Icon name="shield-check" size={16} />
          </span>
          <span className="scr-account__sectext">
            <span className="scr-account__sectitle">{t("screensA.account.twofa")}</span>
            <span className="scr-account__secsub">
              {t("screensA.account.twofaSub")}
            </span>
          </span>
          <Toggle
            checked={acct.twofa}
            onChange={onTwofa}
            label={t("screensA.account.twofa")}
          />
        </div>
      </Card>

      <Eyebrow className="scr-account__eyebrow">
        {t("screensA.account.payment")}
      </Eyebrow>
      <Card padding="16px 18px" className="scr-account__pay">
        <span className="scr-account__paytile">
          <Icon name="credit-card" size={18} />
        </span>
        <span className="scr-account__sectext">
          <span className="scr-account__sectitle">
            {t("screensA.account.cardLabel", {
              brand: SAVED_CARD.brand,
              last4: SAVED_CARD.last4,
            })}
          </span>
          <span className="scr-account__secsub">
            {t("screensA.account.cardMeta", { exp: SAVED_CARD.expires })}
          </span>
        </span>
        <span className="scr-account__default">{t("screensA.account.default")}</span>
      </Card>

      <div className="scr-account__addrow">
        <Button
          variant="ghost"
          icon="plus"
          iconSize={15}
          className="scr-account__add"
          onClick={() => showToast(t("screensA.account.cardDemo"), "warn")}
        >
          {t("screensA.account.addPayment")}
        </Button>
      </div>

      <div className="scr-account__danger">
        <div className="scr-account__dangertext">
          <div className="scr-account__dangertitle">
            {t("screensA.account.closeTitle")}
          </div>
          <div className="scr-account__dangerbody">
            {t("screensA.account.closeBody")}
          </div>
        </div>
        {/* `danger` rather than `ghost` so it gets the `.bk-btn` press
         * behaviour the comp gave it; the outline treatment is below. */}
        <Button
          variant="danger"
          className="scr-account__delete"
          onClick={() =>
            showToast(t("screensA.account.deleteDisabled"), "warn")
          }
        >
          {t("screensA.account.delete")}
        </Button>
      </div>
    </section>
  );
}
