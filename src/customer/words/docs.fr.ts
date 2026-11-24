import type { DocSet } from "./docs.ts";

export const DOCS_FR: DocSet = {
  help: (f) => ({
    title: "Aide",
    intro: "De courtes réponses aux questions que l'on nous pose le plus souvent.",
    items: [
      ["Comment déplacer ou annuler ?", `Ouvrez votre réservation depuis le lien de n'importe quel e-mail de notre part, ou retrouvez-la avec votre code de réservation et votre e-mail. Le déplacement et l'annulation sont gratuits jusqu'à ${String(f.hours)} heures avant.`],
      ["Ai-je besoin d'un compte ?", "Non. Vous pouvez réserver avec votre nom et votre e-mail. Si vous vous connectez, vous voyez toutes vos visites au même endroit. Nous vous envoyons un code par e-mail pour vous connecter. Il n'y a pas de mot de passe."],
      ["Que signifie « N'importe qui » ?", "Nous réservons la personne disponible à l'heure choisie, et répartissons la journée équitablement entre les membres de l'équipe. Vous voyez de qui il s'agit une fois la réservation faite."],
      ["Quand dois-je payer ?", f.hasDeposits ? `La plupart des prestations se règlent au studio. Celles-ci demandent un paiement en ligne au moment de la réservation : ${f.deposits}.` : "Toutes les prestations se règlent au studio."],
      ["Comment allez-vous me contacter ?", "Par e-mail. Votre numéro de téléphone est facultatif : nous l'utilisons si nous devons vous joindre le jour même, et nous n'y envoyons des SMS que si vous cochez la case prévue en réservant. Chaque SMS vous dit comment les arrêter."],
    ],
  }),
  policy: (f) => ({
    title: "Conditions d'annulation",
    intro: "Les mêmes règles s'appliquent à tout le monde.",
    items: [
      [`Jusqu'à ${String(f.hours)} heures avant`, "Annulez ou déplacez gratuitement, en ligne. Si vous avez payé en ligne, la somme retourne automatiquement sur votre carte. Une séance de forfait ou la part d'une carte cadeau est également recréditée."],
      [`Moins de ${String(f.hours)} heures avant`, "Le déplacement n'est pas possible en ligne. Écrivez-nous et nous vous aiderons si nous le pouvons. Si vous annulez, cela compte comme une annulation tardive : un acompte, un paiement en totalité, une séance de forfait ou la part d'une carte cadeau est conservé."],
      ["Si vous ne venez pas", "En cas d'absence, l'acompte, le paiement, la séance de forfait ou la part de la carte cadeau sont conservés de la même manière."],
      ["Si nous annulons", "Si le studio annule votre visite, tout ce que vous avez payé en ligne vous est remboursé intégralement."],
      ["Aucun autre frais", "Il n'y a aucun autre frais pour une annulation, un déplacement ou une absence."],
    ],
  }),
  privacy: () => ({
    title: "Confidentialité",
    intro: "Ce que nous conservons, et qui peut le voir.",
    items: [
      ["Ce que nous conservons", "Votre nom, votre e-mail, votre numéro de téléphone si vous en avez donné un, vos réservations, et tout ce que vous avez écrit dans « Quelque chose à nous signaler ? »."],
      ["Qui peut le voir", "Seulement l'équipe du studio. Vous ne voyez jamais que vos propres réservations. Les horaires libres ou complets n'affichent jamais le nom de quelqu'un d'autre."],
      ["Le calendrier de votre spécialiste", "Si votre spécialiste connecte un calendrier Google ou Outlook, votre visite y apparaît avec votre prénom et votre initiale. Le lendemain matin de la visite, seule la prestation est indiquée."],
      ["Paiements", "Le paiement en ligne se fait sur la page du service de paiement. Nous ne voyons jamais votre carte."],
      ["Avis", "Les avis affichent votre prénom et votre initiale, par exemple « Ava R. ». Jamais votre e-mail."],
      ["E-mail, et SMS si vous le demandez", "Nous vous contactons par e-mail. Nous ne vous envoyons des SMS que si vous cochez la case prévue en réservant : un rappel avant votre visite, et tout créneau libéré sur la liste d'attente que vous avez demandée. Les SMS passent par le fournisseur de SMS du studio et les réseaux téléphoniques, et chacun vous dit comment les arrêter. Chaque demande d'avis comporte un lien pour les arrêter, et vous pouvez les désactiver dans Vos visites."],
      ["Avis Google", "Les avis Google ne se chargent depuis Google que lorsque vous appuyez sur « Voir nos avis Google »."],
      ["Supprimer vos données", "Connectez-vous et choisissez « Supprimer mes données » dans Vos visites. Cela annule les visites à venir, et nous vous le disons d'abord."],
    ],
  }),
  terms: (f) => ({
    title: "Conditions",
    intro: "La version courte du fonctionnement des réservations chez nous.",
    items: [
      ["Votre réservation", `Une réservation est conclue lorsque vous voyez « Votre réservation est confirmée » et que nous vous envoyons un e-mail. Nous gardons un horaire pendant ${String(f.hold)} minutes le temps qu'un acompte soit payé.`],
      ["Prix", `Les prix sont en ${f.currency} et correspondent à ce que vous payez. Il n'y a ni ligne de taxe, ni pourboire, ni frais de service.`],
      ["Acomptes", "Ils se paient sur la page du service de paiement. Nous ne voyons jamais votre carte."],
      ["Période de réservation", `Vous pouvez réserver de ${String(f.notice)} heures à l'avance jusqu'à ${String(f.window)} jours ouvrés à l'avance. Nous sommes fermés les jours que le studio indique comme jours de fermeture.`],
    ],
  }),
};
