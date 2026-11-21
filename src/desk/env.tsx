/**
 * What every desk screen reaches through React: the door into Adminium, and
 * the hooks that read the rows and run a write.
 *
 * A write is run the same way everywhere: while it is on, the screen says so;
 * when it is done, the rows are read again (Adminium's figures, never the
 * screen's guess); when it is refused, the refusal is said in the reader's
 * words, and the rows are read again too, so the screen shows what is true now.
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import type { DeskData, DeskDoor } from "./door.ts";
import { guestFits, type WaitFit } from "./facts.ts";
import { useDeskT, type DeskT } from "./i18n/index.ts";
import { toast, useDesk } from "./store.ts";
import { isApiError } from "./wire.ts";

export interface DeskEnv {
  door: DeskDoor;
  /** Where the desk goes once its person signed out. */
  leave?: () => void;
}

const Ctx = createContext<DeskEnv | null>(null);

export function DeskProvider({ env, children }: { env: DeskEnv; children: ReactNode }) {
  return <Ctx.Provider value={env}>{children}</Ctx.Provider>;
}

export function useEnv(): DeskEnv {
  const env = useContext(Ctx);
  if (env === null) throw new Error("useEnv() outside <DeskProvider>");
  return env;
}

/** Adminium's console actions this person holds; empty until read. A link they could not follow is not drawn (ACC-12). */
export function useSystemActions(): readonly string[] {
  const { door } = useEnv();
  const [held, setHeld] = useState<readonly string[]>([]);
  useEffect(() => {
    let live = true;
    void door.systemActions().then((got) => live && setHeld(got));
    return () => {
      live = false;
    };
  }, [door]);
  return held;
}

/** The rows last read. The shell renders the screens only once there are some. */
export function useData(): DeskData {
  const data = useDesk((s) => s.data);
  if (data === null) throw new Error("useData() before the first read");
  return data;
}

/** The waiting entries' fits, by the guest's rule (cQ33). One entry that cannot be read shows none and stops nothing. */
async function loadFits(door: DeskDoor, data: DeskData): Promise<Record<string, WaitFit[]>> {
  if (!door.who().can("waitlist", "update")) return {};
  const { zone } = door.facts();
  const now = door.now();
  const out: Record<string, WaitFit[]> = {};
  await Promise.all(
    data.waitlist
      .filter((entry) => entry["state"] === "waiting")
      .map(async (entry) => {
        try {
          const slots = await door.slots({ service: entry["service_id"] as string, person: (entry["team_id"] as string | null) ?? null, day: String(entry["day"]).slice(0, 10) });
          out[String(entry.id)] = guestFits(slots, entry, data, now, zone);
        } catch {
          out[String(entry.id)] = [];
        }
      }),
  );
  return out;
}

/** Read every row again, and keep them. */
export async function reload(door: DeskDoor): Promise<void> {
  try {
    const data = await door.load();
    const fits = await loadFits(door, data);
    useDesk.setState({ data, fits, failure: null });
  } catch (error) {
    useDesk.setState({ failure: error instanceof Error ? error.message : String(error) });
  }
}

/** A refusal, in the reader's words: by its code, never its message, except as the last resort. */
export function refusalWords(t: DeskT, error: unknown): { text: string; tone: "warn" | "danger" } {
  if (isApiError(error)) {
    const reason = String(error.params["reason"] ?? "");
    if (error.code === "BOOKING_TAKEN" && reason === "busy") return { text: t("err.busy"), tone: "warn" };
    if (error.code === "BOOKING_TAKEN" && reason === "buffer") return { text: t("err.buffer"), tone: "warn" };
    if (error.code === "BOOKING_TAKEN") return { text: t("err.taken"), tone: "warn" };
    if (error.code === "BOOKING_BUSY") return { text: t("err.tryAgain"), tone: "warn" };
    if (error.code === "ROW_CHANGED" || error.code === "WRITE_CONFLICT" || error.code === "STATE_MOVE_REFUSED") return { text: t("err.moved"), tone: "warn" };
    if (error.status === 403) return { text: t("err.notAllowed"), tone: "danger" };
  }
  return { text: t("err.refused", { why: error instanceof Error ? error.message : String(error) }), tone: "danger" };
}

/** A write as a screen runs it: `busy` while it is on, the rows read again after, a refusal said in a toast. */
export function useRun(): { busy: boolean; run: (work: (door: DeskDoor, data: DeskData) => Promise<string | null | undefined | void>) => Promise<boolean> } {
  const { door } = useEnv();
  const t = useDeskT();
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async (work: (door: DeskDoor, data: DeskData) => Promise<string | null | undefined | void>) => {
      const data = useDesk.getState().data;
      if (data === null) return false;
      setBusy(true);
      try {
        const said = await work(door, data);
        if (typeof said === "string") toast(said, "pos");
        return true;
      } catch (error) {
        const words = refusalWords(t, error);
        toast(words.text, words.tone);
        return false;
      } finally {
        await reload(door);
        setBusy(false);
      }
    },
    [door, t],
  );
  return { busy, run };
}
