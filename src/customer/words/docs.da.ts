import type { DocSet } from "./docs.ts";

export const DOCS_DA: DocSet = {
  help: (f) => ({
    title: "Hjælp",
    intro: "Korte svar på de spørgsmål, vi hører oftest.",
    items: [
      ["Hvordan flytter eller afbestiller jeg?", `Åbn din booking fra linket i en hvilken som helst e-mail fra os, eller find den med din bookingkode og e-mail. Det er gratis at flytte og afbestille op til ${String(f.hours)} timer før.`],
      ["Har jeg brug for en konto?", "Nej. Du kan booke med dit navn og din e-mail. Hvis du logger ind, ser du alle dine besøg ét sted. Vi sender dig en kode på e-mail, så du kan logge ind. Der er ingen adgangskoder."],
      ["Hvad betyder „Hvem som helst“?", "Vi booker den, der er ledig på det tidspunkt, du vælger, og fordeler dagen jævnt på teamet. Du kan se, hvem det er, når bookingen er lavet."],
      ["Hvornår betaler jeg?", f.hasDeposits ? `De fleste behandlinger betales i salonen. Disse kræver en betaling online, når du booker: ${f.deposits}.` : "Alle behandlinger betales i salonen."],
      ["Hvordan kontakter I mig?", "På e-mail. Dit telefonnummer er valgfrit: vi bruger det, hvis vi skal kontakte dig på dagen, og sender kun sms'er til det, hvis du sætter kryds i feltet til det, når du booker. Hver sms fortæller dig, hvordan du stopper dem."],
    ],
  }),
  policy: (f) => ({
    title: "Afbestillingsregler",
    intro: "De samme regler gælder for alle.",
    items: [
      [`Op til ${String(f.hours)} timer før`, "Afbestil eller flyt gratis online. Hvis du har betalt online, går beløbet automatisk tilbage til dit kort. En session fra en pakke eller en del af et gavekort kommer også tilbage."],
      [`Mindre end ${String(f.hours)} timer før`, "Det er ikke muligt at flytte online. Skriv til os, så hjælper vi, hvis vi kan. Hvis du afbestiller, tæller det som en sen afbestilling: Et depositum, en fuld betaling, en session fra en pakke eller en del af et gavekort beholdes."],
      ["Hvis du ikke kommer", "Ved udeblivelse beholdes depositummet, betalingen, sessionen fra pakken eller den del af gavekortet på samme måde."],
      ["Hvis vi aflyser", "Hvis salonen aflyser dit besøg, får du alt, hvad du har betalt online, fuldt tilbage."],
      ["Ingen andre gebyrer", "Der er ikke noget andet gebyr for at afbestille, flytte eller udeblive."],
    ],
  }),
  privacy: () => ({
    title: "Privatliv",
    intro: "Hvad vi gemmer, og hvem der kan se det.",
    items: [
      ["Hvad vi gemmer", "Dit navn, din e-mail, dit telefonnummer, hvis du har angivet et, dine bookinger og alt, hvad du har skrevet i „Er der noget, vi bør vide?“."],
      ["Hvem der kan se det", "Kun salonens team. Du ser altid kun dine egne bookinger. Ledige og fulde tider viser aldrig en andens navn."],
      ["Din behandlers kalender", "Hvis din behandler forbinder en Google- eller Outlook-kalender, vises dit besøg dér med dit fornavn og dit forbogstav. Morgenen efter besøget vises kun behandlingen."],
      ["Betalinger", "Betaling online foregår på betalingstjenestens egen side. Vi ser aldrig dit kort."],
      ["Anmeldelser", "Anmeldelser viser dit fornavn og dit forbogstav, som „Ava R.“. Aldrig din e-mail."],
      ["E-mail, og sms'er hvis du beder om det", "Vi kontakter dig på e-mail. Vi sender kun sms'er, hvis du sætter kryds i feltet til sms'er, når du booker: en påmindelse før dit besøg, og ledige tider fra den venteliste, du har skrevet dig på. Sms'er går gennem studiets sms-udbyder og telenettene, og hver af dem fortæller dig, hvordan du stopper dem. Hver anmodning om anmeldelse har et link til at stoppe dem, og du kan slå dem fra under Dine besøg."],
      ["Google-anmeldelser", "Google-anmeldelser hentes kun fra Google, når du trykker på „Se vores Google-anmeldelser“."],
      ["Sletning af dine oplysninger", "Log ind og vælg „Slet mine oplysninger“ under Dine besøg. Det afbestiller de besøg, der stadig ligger forude, og det siger vi først."],
    ],
  }),
  terms: (f) => ({
    title: "Vilkår",
    intro: "Kortversionen af, hvordan booking hos os fungerer.",
    items: [
      ["Din booking", `En booking er lavet, når du ser „Du er booket“, og vi sender dig en e-mail. Vi holder en tid i ${String(f.hold)} minutter, mens et depositum betales.`],
      ["Priser", `Priserne er i ${f.currency} og er det, du betaler. Der er ingen momslinje, drikkepenge eller servicegebyr.`],
      ["Depositum", "Betales på betalingstjenestens egen side. Vi ser aldrig dit kort."],
      ["Bookingvindue", `Du kan booke fra ${String(f.notice)} timer frem og op til ${String(f.window)} hverdage frem. Vi har lukket de dage, salonen angiver som lukkedage.`],
    ],
  }),
};
