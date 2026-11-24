import type { DocSet } from "./docs.ts";

export const DOCS_CS: DocSet = {
  help: (f) => ({
    title: "Nápověda",
    intro: "Krátké odpovědi na otázky, které slýcháme nejčastěji.",
    items: [
      ["Jak rezervaci přesunu nebo zruším?", `Otevřete svou rezervaci z odkazu v kterémkoli našem e-mailu, nebo ji najděte pomocí kódu rezervace a e-mailu. Přesunutí i zrušení je zdarma nejpozději ${String(f.hours)} hodin předem.`],
      ["Potřebuji účet?", "Ne. Rezervovat můžete se jménem a e-mailem. Když se přihlásíte, uvidíte všechny své návštěvy na jednom místě. K přihlášení vám pošleme kód e-mailem. Žádná hesla nejsou."],
      ["Co znamená „Kdokoli“?", "Rezervujeme toho, kdo je ve vámi zvoleném čase volný, a den rovnoměrně rozdělujeme mezi tým. Kdo to je, uvidíte po dokončení rezervace."],
      ["Kdy platím?", f.hasDeposits ? `Většina služeb se platí ve studiu. U těchto se při rezervaci platí online: ${f.deposits}.` : "Každá služba se platí ve studiu."],
      ["Jak mě budete kontaktovat?", "E-mailem. Telefonní číslo je nepovinné: použijeme ho, když vás musíme v den návštěvy zastihnout, a SMS na něj posíláme, jen když při rezervaci zaškrtnete políčko pro SMS. Každá SMS vám řekne, jak je zastavit."],
    ],
  }),
  policy: (f) => ({
    title: "Storno podmínky",
    intro: "Pro všechny platí stejná pravidla.",
    items: [
      [`Nejpozději ${String(f.hours)} hodin předem`, "Zrušte nebo přesuňte zdarma, online. Pokud jste platili online, částka se automaticky vrátí na vaši kartu. Vrátí se i návštěva z balíčku nebo část dárkového poukazu."],
      [`Méně než ${String(f.hours)} hodin předem`, "Přesunutí online není možné. Napište nám e-mail a pomůžeme, pokud to půjde. Pokud zrušíte, počítá se to jako pozdní zrušení: záloha, platba v plné výši, návštěva z balíčku nebo část dárkového poukazu propadá."],
      ["Pokud nepřijdete", "Při nedostavení se propadá záloha, platba, návštěva z balíčku nebo část dárkového poukazu stejným způsobem."],
      ["Pokud zrušíme my", "Pokud studio vaši návštěvu zruší, vrátí se vám vše, co jste zaplatili online, v plné výši."],
      ["Žádné další poplatky", "Za zrušení, přesunutí ani nedostavení se se neplatí žádný další poplatek."],
    ],
  }),
  privacy: () => ({
    title: "Soukromí",
    intro: "Co uchováváme a kdo to vidí.",
    items: [
      ["Co uchováváme", "Vaše jméno, e-mail, telefonní číslo, pokud jste ho uvedli, vaše rezervace a vše, co jste napsali do pole „Je něco, co bychom měli vědět?“."],
      ["Kdo to vidí", "Pouze tým studia. Vy vždy vidíte jen své vlastní rezervace. Volné a plné časy nikdy neukazují jméno někoho jiného."],
      ["Kalendář vašeho specialisty", "Pokud váš specialista propojí kalendář Google nebo Outlook, vaše návštěva se tam zobrazí s vaším křestním jménem a iniciálou. Ráno po návštěvě se zobrazuje už jen služba."],
      ["Platby", "Online platba probíhá na stránce platební služby. Vaši kartu nikdy nevidíme."],
      ["Recenze", "Recenze zobrazují vaše křestní jméno a iniciálu, například „Ava R.“. Nikdy váš e-mail."],
      ["E-mail a SMS, pokud o ně požádáte", "Kontaktujeme vás e-mailem. SMS vám posíláme, jen když při rezervaci zaškrtnete políčko pro SMS: připomínku před návštěvou a uvolněné termíny z pořadníku, o které jste požádali. SMS jdou přes poskytovatele SMS studia a telefonní sítě a každá vám řekne, jak je zastavit. Každá žádost o recenzi obsahuje odkaz, jímž je lze zastavit, a můžete je vypnout ve Vašich návštěvách."],
      ["Recenze z Googlu", "Recenze z Googlu se z Googlu načtou, jen když stisknete „Zobrazit naše recenze na Googlu“."],
      ["Smazání vašich údajů", "Přihlaste se a ve Vašich návštěvách zvolte „Smazat moje údaje“. Tím se zruší návštěvy, které jsou ještě před vámi, a řekneme vám to předem."],
    ],
  }),
  terms: (f) => ({
    title: "Podmínky",
    intro: "Stručně o tom, jak u nás rezervace fungují.",
    items: [
      ["Vaše rezervace", `Rezervace vzniká, když uvidíte „Máte rezervováno“ a my vám pošleme e-mail. Termín držíme ${String(f.hold)} minut, dokud se platí záloha.`],
      ["Ceny", `Ceny jsou v ${f.currency} a jsou to, co zaplatíte. Žádný řádek s daní, spropitné ani poplatek za obsluhu se nepřičítá.`],
      ["Zálohy", "Platí se na stránce platební služby. Vaši kartu nikdy nevidíme."],
      ["Lhůta pro rezervaci", `Rezervovat můžete od ${String(f.notice)} hodin předem až po ${String(f.window)} pracovních dnů předem. V dnech, které studio uvádí jako dny uzavření, máme zavřeno.`],
    ],
  }),
};
