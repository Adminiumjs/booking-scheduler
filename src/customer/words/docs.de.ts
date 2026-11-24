import type { DocSet } from "./docs.ts";

export const DOCS_DE: DocSet = {
  help: (f) => ({
    title: "Hilfe",
    intro: "Kurze Antworten auf die Fragen, die wir am häufigsten hören.",
    items: [
      ["Wie verschiebe oder storniere ich?", `Öffnen Sie Ihre Buchung über den Link in einer beliebigen E-Mail von uns oder finden Sie sie mit Ihrem Buchungscode und Ihrer E-Mail-Adresse. Verschieben und Stornieren sind bis ${String(f.hours)} Stunden vorher kostenlos.`],
      ["Brauche ich ein Konto?", "Nein. Sie können mit Ihrem Namen und Ihrer E-Mail-Adresse buchen. Wenn Sie sich anmelden, sehen Sie alle Ihre Besuche an einem Ort. Zum Anmelden senden wir Ihnen einen Code per E-Mail. Es gibt keine Passwörter."],
      ["Was bedeutet „Beliebig“?", "Wir buchen, wer zur gewählten Zeit frei ist, und verteilen den Tag gleichmäßig auf das Team. Wer es ist, sehen Sie, sobald die Buchung steht."],
      ["Wann zahle ich?", f.hasDeposits ? `Die meisten Leistungen zahlen Sie im Studio. Bei diesen wird beim Buchen online eine Zahlung fällig: ${f.deposits}.` : "Jede Leistung zahlen Sie im Studio."],
      ["Wie nehmen Sie Kontakt mit mir auf?", "Per E-Mail. Ihre Telefonnummer ist optional: Wir nutzen sie, falls wir Sie am Tag selbst erreichen müssen, und senden SMS nur, wenn Sie beim Buchen das Kästchen dafür ankreuzen. Jede SMS sagt Ihnen, wie Sie sie abbestellen."],
    ],
  }),
  policy: (f) => ({
    title: "Stornierungsbedingungen",
    intro: "Für alle gelten dieselben Regeln.",
    items: [
      [`Bis ${String(f.hours)} Stunden vorher`, "Kostenlos online stornieren oder verschieben. Wenn Sie online bezahlt haben, geht der Betrag automatisch auf Ihre Karte zurück. Eine Einheit aus Ihrem Paket oder der Anteil einer Geschenkkarte wird ebenfalls zurückgebucht."],
      [`Weniger als ${String(f.hours)} Stunden vorher`, "Verschieben ist online nicht möglich. Schreiben Sie uns eine E-Mail, wir helfen, wenn wir können. Wenn Sie stornieren, gilt das als späte Stornierung: Eine Anzahlung, eine vollständige Zahlung, eine Einheit aus Ihrem Paket oder der Anteil einer Geschenkkarte bleibt einbehalten."],
      ["Wenn Sie nicht kommen", "Bei Nichterscheinen bleiben die Anzahlung, die Zahlung, die Einheit aus dem Paket oder der Anteil der Geschenkkarte auf dieselbe Weise einbehalten."],
      ["Wenn wir stornieren", "Wenn das Studio Ihren Besuch absagt, erhalten Sie alles, was Sie online bezahlt haben, vollständig zurück."],
      ["Keine weiteren Gebühren", "Für Stornieren, Verschieben oder Nichterscheinen fällt keine weitere Gebühr an."],
    ],
  }),
  privacy: () => ({
    title: "Datenschutz",
    intro: "Was wir speichern und wer es sieht.",
    items: [
      ["Was wir speichern", "Ihren Namen, Ihre E-Mail-Adresse, Ihre Telefonnummer, falls Sie eine angegeben haben, Ihre Buchungen und alles, was Sie unter „Gibt es etwas, das wir wissen sollten?“ geschrieben haben."],
      ["Wer es sieht", "Nur das Studioteam. Sie selbst sehen immer nur Ihre eigenen Buchungen. Freie und volle Zeiten zeigen nie den Namen einer anderen Person."],
      ["Der Kalender Ihrer Fachkraft", "Wenn Ihre Fachkraft einen Google- oder Outlook-Kalender verbindet, erscheint Ihr Besuch dort mit Ihrem Vornamen und Ihrem Anfangsbuchstaben. Am Morgen nach dem Besuch wird nur noch die Leistung angezeigt."],
      ["Zahlungen", "Die Online-Zahlung erfolgt auf der Seite des Zahlungsdienstes. Wir sehen Ihre Karte nie."],
      ["Bewertungen", "Bewertungen zeigen Ihren Vornamen und Ihren Anfangsbuchstaben, etwa „Ava R.“. Nie Ihre E-Mail-Adresse."],
      ["E-Mail und SMS, wenn Sie möchten", "Wir kontaktieren Sie per E-Mail. SMS senden wir nur, wenn Sie beim Buchen das Kästchen dafür ankreuzen: eine Erinnerung vor Ihrem Termin und frei gewordene Termine von Ihrer Warteliste. SMS laufen über den SMS-Anbieter des Studios und die Mobilfunknetze, und jede sagt Ihnen, wie Sie sie abbestellen. Jede Bewertungsanfrage enthält einen Link, um sie zu beenden, und Sie können sie unter „Ihre Besuche“ ausschalten."],
      ["Google-Bewertungen", "Google-Bewertungen werden nur dann von Google geladen, wenn Sie auf „Unsere Google-Bewertungen ansehen“ drücken."],
      ["Ihre Daten löschen", "Melden Sie sich an und wählen Sie unter „Ihre Besuche“ die Option „Meine Daten löschen“. Dadurch werden die noch bevorstehenden Besuche storniert, und wir weisen vorher darauf hin."],
    ],
  }),
  terms: (f) => ({
    title: "Bedingungen",
    intro: "Die Kurzfassung, wie die Buchung bei uns funktioniert.",
    items: [
      ["Ihre Buchung", `Eine Buchung kommt zustande, wenn Sie „Ihre Buchung steht“ sehen und wir Ihnen eine E-Mail senden. Wir halten eine Zeit ${String(f.hold)} Minuten lang frei, während eine Anzahlung bezahlt wird.`],
      ["Preise", `Die Preise sind in ${f.currency} angegeben und sind das, was Sie zahlen. Es gibt keine Steuerzeile, kein Trinkgeld und keine Servicegebühr.`],
      ["Anzahlungen", "Sie werden auf der Seite des Zahlungsdienstes bezahlt. Wir sehen Ihre Karte nie."],
      ["Buchungszeitraum", `Sie können ab ${String(f.notice)} Stunden im Voraus bis ${String(f.window)} Werktage im Voraus buchen. An den Tagen, die das Studio als Schließtage angibt, haben wir geschlossen.`],
    ],
  }),
};
