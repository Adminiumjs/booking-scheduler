/** A calendar still being disconnected must not stop the next person connecting, whoever is at the desk. */
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { I18nProvider } from "../../i18n/index.tsx";
import type { PersonCalendar } from "../door.ts";
import { en } from "../i18n/en.ts";
import { CalendarPart } from "./Team.tsx";

const held = vi.hoisted(() => ({ calendar: {} as unknown, userId: "" }));

vi.mock("../env.tsx", () => ({
  useEnv: () => ({
    door: {
      who: () => ({ id: held.userId, can: () => true }),
      facts: () => ({ zone: "UTC", currency: "USD" }),
      feedLink: async () => null,
    },
  }),
  useData: () => ({ calendars: { "7": held.calendar } }),
  useRun: () => ({ busy: false, run: () => undefined }),
}));

const OWNER = { connect: true, sendLink: true, copyLink: true, disconnect: true };
const FRONT_DESK = { connect: false, sendLink: true, copyLink: false, disconnect: false };
const SPECIALIST = { connect: true, sendLink: false, copyLink: false, disconnect: true };
const NOTHING = { connect: false, sendLink: false, copyLink: false, disconnect: false };

const person = { id: 7, name: "Noor Haddad", user_id: "noor" };
const connectGoogle = en["team.connectTo"].replace("{provider}", "Google Calendar");
const connectOutlook = en["team.connectTo"].replace("{provider}", "Outlook Calendar");
const sendLink = en["calendar.sendLink"].replace("{who}", "Noor");

function drawn(may: PersonCalendar["may"], userId: string, reach: PersonCalendar["reach"] = "push") {
  held.userId = userId;
  held.calendar = {
    accounts: [{ id: "a1", provider: "calendar-google", providerName: "Google Calendar", state: "disconnecting", since: 0, address: "noor@example.test", addressDiffers: false, grantEndsAt: null }],
    providers: [
      { key: "calendar-google", name: "Google Calendar" },
      { key: "calendar-microsoft", name: "Outlook Calendar" },
    ],
    reach,
    may,
    sync: null,
  };
  return renderToString(
    <I18nProvider>
      <CalendarPart person={person} />
    </I18nProvider>,
  );
}

describe("a calendar on its way out", () => {
  it("still says it is disconnecting, and offers nothing that would act on the old connection", () => {
    const html = drawn(OWNER, "owner");
    expect(html).toContain(en["team.disconnecting"]);
    for (const old of [en["team.disconnect"], en["team.syncNow"], en["team.settings"]]) expect(html).not.toContain(`>${old}<`);
  });

  it("lets the owner send a colleague a new link, and not sign in on their row", () => {
    const html = drawn(OWNER, "owner");
    expect(html).toContain(sendLink);
    expect(html).not.toContain(connectGoogle);
  });

  it("lets the front desk send a new link", () => {
    const html = drawn(FRONT_DESK, "desk");
    expect(html).toContain(sendLink);
    expect(html).not.toContain(connectGoogle);
  });

  it("lets the specialist connect their own row again, through either calendar", () => {
    const html = drawn(SPECIALIST, "noor");
    expect(html).toContain(connectGoogle);
    expect(html).toContain(connectOutlook);
    expect(html).not.toContain(sendLink);
  });

  it("offers nothing to someone the server gives neither right", () => {
    const html = drawn(NOTHING, "guest-staff");
    expect(html).not.toContain(sendLink);
    expect(html).not.toContain(connectGoogle);
  });

  it("offers nothing while this server cannot connect a calendar", () => {
    const html = drawn(OWNER, "owner", "cannot-connect");
    expect(html).not.toContain(sendLink);
    expect(html).not.toContain(connectGoogle);
  });
});
