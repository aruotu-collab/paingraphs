export type RedditQuote = { quote: string; title: string; url: string };

export type RedditPain = {
  categoryId: string;
  clusterSlug: string;
  clusterName: string;
  clusterSummary: string;
  slug: string;
  title: string;
  h1: string;
  problem: string;
  analysis: string;
  whyNow: string;
  sensitive: boolean;
  fallbackQuotes: RedditQuote[];
  criteria: { slug: string; name: string; detail: string }[];
  products: {
    slug: string;
    name: string;
    summary: string;
    whoFor: string;
    searchQuery: string;
    priceBand: string;
    note: string;
    scores: Record<string, number>;
  }[];
};

export const REDDIT_PAINS: RedditPain[] = [
  {
    categoryId: "cat-clothes",
    clusterSlug: "jeans-fit",
    clusterName: "Jeans fit",
    clusterSummary: "Thighs that need room and a waist that does not.",
    slug: "jeans-thigh-waist",
    title: "Jeans that fit thighs without a waist gap",
    h1: "When jeans that fit your thighs gap at the waist",
    problem:
      "If the thighs fit, the waist stands away. If the waist fits, the thighs bind. People dart, belt, size up, or stop buying denim.",
    analysis:
      "The useful split is cut, not a miracle stretch. Curvy / athletic cuts add thigh room. A tailor dart is slower and usually wins. Stretch denim hides a gap for an hour and bags out. Do not treat this as a diet problem.",
    whyNow:
      "One thread hit 5,000 comments. Brands still sell one-shape jeans and call it inclusive.",
    sensitive: false,
    fallbackQuotes: [
      {
        quote:
          "Jeans that fit my thighs NEVER fit my waist. It's such a common issue, too. You'd think companies could figure out how to put a couple darts in.",
        title: "Jeans that fit my thighs NEVER fit my waist",
        url: "https://www.reddit.com/r/mildlyinfuriating/comments/1vx9vwv/jeans_that_fit_my_thighs_never_fit_my_waist/",
      },
      {
        quote:
          "Guess I'll just keep doing it myself.",
        title: "Jeans that fit my thighs NEVER fit my waist",
        url: "https://www.reddit.com/r/mildlyinfuriating/comments/1vx9vwv/jeans_that_fit_my_thighs_never_fit_my_waist/",
      },
    ],
    criteria: [
      { slug: "thighs", name: "Thighs fit", detail: "Sit and walk without the fabric cutting in." },
      { slug: "waist", name: "Waist sits", detail: "No gap when you bend. A belt is backup, not the fit." },
      { slug: "keep", name: "You will wear them", detail: "A cut you can buy again, not a one-pair hunt." },
      { slug: "alter", name: "Alter vs buy", detail: "Whether a dart is cheaper than another failed pair." },
    ],
    products: [
      {
        slug: "curvy-cut",
        name: "Curvy or athletic cut",
        summary: "More room through the seat and thigh, a smaller waist. Hit or miss by brand.",
        whoFor: "Best if your measurement gap is real and you still want denim.",
        searchQuery: "curvy fit jeans thighs waist gap",
        priceBand: "£40–£120",
        note: "First buy to try. Still try before you commit to a stack.",
        scores: { thighs: 82, waist: 74, keep: 70, alter: 50 },
      },
      {
        slug: "tailor-dart",
        name: "Tailor dart the waist",
        summary: "Buy for the thighs, take in the waist. Slow. Highest odds.",
        whoFor: "Best if one pair already fits the legs and you will pay for a dart.",
        searchQuery: "jeans waist dart tailoring thighs fit",
        priceBand: "£15–£40",
        note: "Unsexy. Usually the missing step.",
        scores: { thighs: 88, waist: 90, keep: 64, alter: 94 },
      },
      {
        slug: "stretch-upsize",
        name: "Stretch denim sized for thighs",
        summary: "Gives in the leg. Often bags at the waist by afternoon.",
        whoFor: "Best as a cheap trial, not as the long-term cut.",
        searchQuery: "stretch jeans athletic thigh",
        priceBand: "£25–£70",
        note: "Easy to buy. Easy to hate by 4pm.",
        scores: { thighs: 76, waist: 42, keep: 55, alter: 30 },
      },
    ],
  },
  {
    categoryId: "cat-home",
    clusterSlug: "cat-litter",
    clusterName: "Cat litter",
    clusterSummary: "Smell and tracking that daily scooping does not fix.",
    slug: "litter-still-stinks",
    title: "Litter that does not leave the house reeking",
    h1: "When the box still stinks after you scooped",
    problem:
      "You scoop several times a day. Scented clay does nothing. The house smells like the box, and guests notice before you do.",
    analysis:
      "The useful split is ammonia control, ventilation, and whether the box is too small. Unscented clump plus a bigger box beats perfume clay. An enclosed box can trap smell. A vet check matters if this started suddenly.",
    whyNow:
      "One smell thread pulled 1,800 comments. Scented clay is still the default aisle.",
    sensitive: false,
    fallbackQuotes: [
      {
        quote:
          "My cat's litter smells so bad i'm going insane. my house absolutely reeks. I clean their box MUTIPLE times a day and it still REEKS of cat poop and pee.",
        title: "My cat's litter smells so bad i'm going insane. my house absolutely reeks.",
        url: "https://www.reddit.com/r/CatAdvice/comments/1ozinvo/my_cats_litter_smells_so_bad_im_going_insane_my/",
      },
      {
        quote:
          "i use scented clay litter and i swear it doesn't even do anything.",
        title: "My cat's litter smells so bad i'm going insane. my house absolutely reeks.",
        url: "https://www.reddit.com/r/CatAdvice/comments/1ozinvo/my_cats_litter_smells_so_bad_im_going_insane_my/",
      },
    ],
    criteria: [
      { slug: "smell", name: "House does not reek", detail: "A visitor should not smell the box from the hall." },
      { slug: "scoop", name: "Daily scoop works", detail: "Cleaning should reset the room, not just move ammonia." },
      { slug: "cat", name: "Cat will use it", detail: "A fancy box they avoid is a floor problem." },
      { slug: "clinic", name: "When to get checked", detail: "Sudden smell or straining needs a vet, not a new brand." },
    ],
    products: [
      {
        slug: "bigger-unscented",
        name: "Bigger box, unscented clump",
        summary: "Volume and a litter that traps ammonia, not perfume.",
        whoFor: "Best if the box is small or the litter is scented clay.",
        searchQuery: "large litter box unscented clumping litter",
        priceBand: "£20–£60",
        note: "First move. Boring on purpose.",
        scores: { smell: 78, scoop: 82, cat: 80, clinic: 55 },
      },
      {
        slug: "wood-or-tofu",
        name: "Wood, tofu, or crystal switch",
        summary: "Different ammonia trap. Tracking and dust change too.",
        whoFor: "Best if clay already failed and the cat will accept a new texture.",
        searchQuery: "tofu wood pellet litter low odor",
        priceBand: "£12–£35",
        note: "Helps some houses. Easy to chase brands weekly.",
        scores: { smell: 74, scoop: 70, cat: 62, clinic: 50 },
      },
      {
        slug: "vet",
        name: "Vet if this is new",
        summary: "Rules out urine infection or a diet change the box cannot fix.",
        whoFor: "Best if smell spiked, or the cat strains or hides.",
        searchQuery: "vet cat litter box sudden smell",
        priceBand: "varies",
        note: "Right when red flags are present.",
        scores: { smell: 70, scoop: 50, cat: 75, clinic: 96 },
      },
    ],
  },
  {
    categoryId: "cat-home",
    clusterSlug: "cat-litter",
    clusterName: "Cat litter",
    clusterSummary: "Smell and tracking that daily scooping does not fix.",
    slug: "litter-tracks-house",
    title: "Litter that does not follow you through the house",
    h1: "When litter ends up in the bed and on the floor",
    problem:
      "You vacuum every day. Grains are still on hardwood, in socks, and in the bed. Low-tracking bags do not live up to the label.",
    analysis:
      "The useful split is particle size, a mat that actually catches, and a box placement that is not a runway. Larger pellets track less. Fine clay rides paws. A mat without a lip just relocates the mess.",
    whyNow:
      "People are vacuuming daily and still stepping on grit. The aisle sells “low tracking” as a personality.",
    sensitive: false,
    fallbackQuotes: [
      {
        quote:
          "I'm so sick of stepping on cat litter on hardwood floors. I tried plenty of “low tracking” litters, clumping litters, scented litters and nothing does it all.",
        title: "I'm so sick of stepping on cat litter on hardwood floors. Give me recommendations?",
        url: "https://www.reddit.com/r/CatAdvice/comments/1s052wf/im_so_sick_of_stepping_on_cat_litter_on_hardwood/",
      },
      {
        quote:
          "I know all litter tracks. I vacuum every single day. I just need something that won't end up in my bed.",
        title: "Be forreal, i need to know a litter that’s non tracking and will not kill my cat",
        url: "https://www.reddit.com/r/CatAdvice/comments/1npziz5/be_forreal_i_need_to_know_a_litter_thats_non/",
      },
    ],
    criteria: [
      { slug: "floor", name: "Floor stays clear", detail: "Hardwood should not crunch after one day." },
      { slug: "bed", name: "Not in the bed", detail: "Paws should not ferry grit onto sheets." },
      { slug: "vacuum", name: "Vacuum is backup", detail: "Daily vacuum should be optional, not the plan." },
      { slug: "cat", name: "Cat still goes", detail: "Pellets they refuse are a floor problem of another kind." },
    ],
    products: [
      {
        slug: "pellet-mat",
        name: "Larger pellets plus a lipped mat",
        summary: "Fewer grains on paws, a mat that dumps back into the box.",
        whoFor: "Best if clay dust is what you keep finding in socks.",
        searchQuery: "low tracking pellet litter litter mat with lip",
        priceBand: "£20–£50",
        note: "First move for hardwood. Not magic.",
        scores: { floor: 80, bed: 74, vacuum: 70, cat: 68 },
      },
      {
        slug: "top-entry",
        name: "Top-entry or covered walk-off",
        summary: "Forces a wipe of the paws. Some cats refuse the lid.",
        whoFor: "Best if the cat already uses a covered box.",
        searchQuery: "top entry litter box low tracking",
        priceBand: "£30–£80",
        note: "Helps tracking. Can trap smell. See the smell page.",
        scores: { floor: 78, bed: 76, vacuum: 72, cat: 55 },
      },
      {
        slug: "place-change",
        name: "Move the box off the runway",
        summary: "Not next to the bed, not a straight dash onto carpet.",
        whoFor: "Best if the box sits where people walk barefoot.",
        searchQuery: "where to put litter box hardwood",
        priceBand: "£0",
        note: "Free. Often skipped.",
        scores: { floor: 70, bed: 82, vacuum: 60, cat: 75 },
      },
    ],
  },
  {
    categoryId: "cat-home",
    clusterSlug: "laundry-smell",
    clusterName: "Laundry smell",
    clusterSummary: "Towels and pits that still smell after a wash.",
    slug: "laundry-still-smells",
    title: "Laundry that actually comes out clean",
    h1: "When the wash still leaves a smell",
    problem:
      "Towels go sour. Armpits survive the cycle. Moving house or a new machine makes it worse. More detergent often makes it worse again.",
    analysis:
      "The useful split is residue, machine biofilm, and whether the load can rinse. Too much detergent plus a cold quick wash leaves soil in the cloth. An acid rinse and a cleaner drum beat a new scent bead. Do not treat this as a nose problem.",
    whyNow:
      "r/laundry exists because the aisle sells more perfume instead of a rinse that works.",
    sensitive: false,
    fallbackQuotes: [
      {
        quote:
          "This sub ruins you forever. I've mentioned in passing that my MIL complained about her washing machine not getting her clothes clean.",
        title: "This sub ruins you forever",
        url: "https://www.reddit.com/r/laundry/comments/1uvv65q/this_sub_ruins_you_forever/",
      },
      {
        quote:
          "r/laundry is filled with tales of woe - smelly armpits, mystery stains, socks the color of cream of mushroom soup.",
        title: "Laundry 101 With u/KismaiAesthetics",
        url: "https://www.reddit.com/r/laundry/comments/1qeqmng/laundry_101_with_ukismaiaesthetics/",
      },
    ],
    criteria: [
      { slug: "smell", name: "Smell is gone", detail: "Towels and pits should not sour by the next wear." },
      { slug: "rinse", name: "Rinse actually finishes", detail: "No crunchy detergent left in the cloth." },
      { slug: "machine", name: "Machine is clean", detail: "A filthy drum will re-stink every load." },
      { slug: "keep", name: "You will keep doing it", detail: "A weekly habit, not a 12-step spa day." },
    ],
    products: [
      {
        slug: "less-detergent",
        name: "Less detergent, longer rinse",
        summary: "Dose down, skip the beads, give the rinse time.",
        whoFor: "Best if you already use a lot of liquid and the clothes feel coated.",
        searchQuery: "washing machine too much detergent smell",
        priceBand: "£0",
        note: "First move. Hardest to believe.",
        scores: { smell: 80, rinse: 88, machine: 60, keep: 70 },
      },
      {
        slug: "acid-rinse",
        name: "Citric acid or sour rinse",
        summary: "Clears mineral and soap film the perfume cannot.",
        whoFor: "Best if towels went musty after a hard-water move.",
        searchQuery: "citric acid laundry rinse musty towels",
        priceBand: "£4–£12",
        note: "Unsexy. A staple in that sub for a reason.",
        scores: { smell: 84, rinse: 86, machine: 65, keep: 62 },
      },
      {
        slug: "clean-drum",
        name: "Clean the machine",
        summary: "Hot maintenance cycle, gasket wipe, skip the closed-door wet drum.",
        whoFor: "Best if every load smells the same no matter the clothes.",
        searchQuery: "clean washing machine gasket mildew smell",
        priceBand: "£3–£10",
        note: "Fixes the box, not one shirt.",
        scores: { smell: 78, rinse: 70, machine: 92, keep: 58 },
      },
    ],
  },
  {
    categoryId: "cat-home",
    clusterSlug: "mattress",
    clusterName: "Mattress",
    clusterSummary: "Sag in the middle and two people who do not weigh the same.",
    slug: "mattress-sags",
    title: "A mattress that does not sag under you",
    h1: "When the middle of the bed becomes a hammock",
    problem:
      "The centre dips. A partner of a different weight rolls you downhill. Warranty photos get denied. People start googling “every mattress sucks”.",
    analysis:
      "The useful split is support vs comfort layer, and whether two bodies need two surfaces. A topper hides a dip for a month. A split king is ugly and often the honest fix. Foam that feels plush in the shop is what hammocks later.",
    whyNow:
      "Bed-in-a-box ads are loud, and sag is easy to treat as a shopping addiction.",
    sensitive: false,
    fallbackQuotes: [
      {
        quote:
          "Sleep on latex mattress, couple years old. was sagging in middle like all mattresses do.. and causing back pain.",
        title: "Cut Mattress into quadrants",
        url: "https://www.reddit.com/r/Mattress/comments/1v1rgd1/cut_mattress_into_quadrants/",
      },
      {
        quote:
          "Anyone else find themselves here? Like I do some searching and there’s always a group of people saying it sags in 3 months… terrible mattress.",
        title: "In the “every mattress sucks” rabbit hole",
        url: "https://www.reddit.com/r/Mattress/comments/1seehxp/in_the_every_mattress_sucks_rabbit_hole/",
      },
    ],
    criteria: [
      { slug: "edge", name: "Middle stays flat", detail: "You should not wake in a trench." },
      { slug: "pair", name: "Two weights", detail: "A 40kg gap should not roll one of you." },
      { slug: "back", name: "Back in the morning", detail: "Stiffness should ease, not start, in this bed." },
      { slug: "cost", name: "Cost to be wrong", detail: "A trial that actually lets you send it back." },
    ],
    products: [
      {
        slug: "firm-support",
        name: "Support-core mattress with a trial",
        summary: "A coil or latex core, not a single foam slab. Sleep on it 30+ nights.",
        whoFor: "Best if the current bed hammocks and you can return it.",
        searchQuery: "hybrid mattress trial sag resistant",
        priceBand: "£400–£1,200",
        note: "Buy on trial terms. Shop-floor plush is the trap.",
        scores: { edge: 78, pair: 60, back: 74, cost: 55 },
      },
      {
        slug: "split-king",
        name: "Split surfaces",
        summary: "Two twins or a split king when the weight gap is the whole problem.",
        whoFor: "Best if one person sinks and the other is stuck on a ridge.",
        searchQuery: "split king mattress different firmness couple",
        priceBand: "£600–£1,800",
        note: "Ugly. Often the honest couple fix.",
        scores: { edge: 80, pair: 92, back: 76, cost: 40 },
      },
      {
        slug: "topper-temp",
        name: "Topper as a delay",
        summary: "Softens a ridge for a while. Will not rebuild a collapsed core.",
        whoFor: "Best if you need a month while you plan a replacement.",
        searchQuery: "mattress topper sag middle",
        priceBand: "£40–£150",
        note: "Useful delay. Easy to mistake for a fix.",
        scores: { edge: 45, pair: 48, back: 52, cost: 78 },
      },
    ],
  },
  {
    categoryId: "cat-shoes",
    clusterSlug: "shift-feet",
    clusterName: "Shift feet",
    clusterSummary: "Feet that macerate through a 12-hour shift.",
    slug: "shift-feet-pruny",
    title: "Work shoes that do not soak your feet",
    h1: "When a 12-hour shift leaves your toes white",
    problem:
      "Socks come off pruny. Shoes are still damp at the next clock-in. People call it trench foot and keep buying the same clog.",
    analysis:
      "The useful split is moisture, rotation, and whether the shoe can dry. One pair worn daily cannot dry. Merino or change-mid-shift socks beat a thicker insole. This is not a bunion-width page.",
    whyNow:
      "Twelve-hour floors are normal, and “nursing shoe” is a marketing category with no drying plan.",
    sensitive: true,
    fallbackQuotes: [
      {
        quote:
          "I swear I’m giving myself trench foot. Need recommendations from sweaty nurses. I work 12s in the OR and my feet are so sweaty by the end of the day that I take my socks off and my toes are white, pruny.",
        title: "I swear I’m giving myself trench foot. Need recommendations from sweaty nurses.",
        url: "https://www.reddit.com/r/nursing/comments/1p7ak68/i_swear_im_giving_myself_trench_foot_need/",
      },
      {
        quote:
          "I work 12s in the OR and I swear to God, my feet are so sweaty by the end of the day that I take my socks off and my toes are white, pruny.",
        title: "I swear I’m giving myself trench foot. Need recommendations from sweaty nurses.",
        url: "https://www.reddit.com/r/nursing/comments/1p7ak68/i_swear_im_giving_myself_trench_foot_need/",
      },
    ],
    criteria: [
      { slug: "dry", name: "Feet stay dry", detail: "Toes should not be white when the socks come off." },
      { slug: "shift", name: "Lasts a 12", detail: "Hour 11 should not be worse than hour 3 only from sweat." },
      { slug: "rotate", name: "You can rotate", detail: "A second pair that can dry beats one hero shoe." },
      { slug: "clinic", name: "When to get checked", detail: "Breaks in the skin or fungus need a person." },
    ],
    products: [
      {
        slug: "two-pair",
        name: "Two pairs and a dry day",
        summary: "Wear one, dry one. The missing step in most “best nursing shoe” lists.",
        whoFor: "Best if you own one pair and it never dries.",
        searchQuery: "nursing shoes rotate two pairs breathable",
        priceBand: "£70–£160",
        note: "Buy the second pair before a fancier first pair.",
        scores: { dry: 86, shift: 80, rotate: 94, clinic: 60 },
      },
      {
        slug: "sock-change",
        name: "Merino or mid-shift sock change",
        summary: "Wicks, or a spare pair at break. Cheap.",
        whoFor: "Best if the shoe is fine and the sock is a sponge.",
        searchQuery: "merino work socks sweaty feet 12 hour shift",
        priceBand: "£8–£20",
        note: "Unsexy. Often enough with rotation.",
        scores: { dry: 78, shift: 74, rotate: 70, clinic: 55 },
      },
      {
        slug: "clinic",
        name: "GP or podiatry if skin breaks",
        summary: "Maceration plus cracks is an infection risk, not a clog review.",
        whoFor: "Best if skin is splitting or this has lasted months.",
        searchQuery: "podiatrist sweaty feet maceration work",
        priceBand: "varies",
        note: "Right when the skin is not intact.",
        scores: { dry: 70, shift: 60, rotate: 50, clinic: 96 },
      },
    ],
  },
  {
    categoryId: "cat-personal-care",
    clusterSlug: "night-sweats",
    clusterName: "Night sweats",
    clusterSummary: "Waking drenched and changing clothes at 2am.",
    slug: "night-sweats-sheets",
    title: "Nights that do not soak the sheets",
    h1: "When you wake up drenched and have to change",
    problem:
      "You wake several times, clothes stuck, sheets wet. HRT may have stopped daytime flashes and left the night ones. People buy cooling sheets and still change at 2am.",
    analysis:
      "The useful split is temperature regulation, bedding that can be swapped, and whether this needs a clinician. Cooling fabric helps some people and markets to everyone. A GP visit matters if this is new, with weight loss, or off hormones. This is not the 3am-brain-on page.",
    whyNow:
      "Menopause aisles sell moisture-wicking everything, and a soaked night is easy to treat as a cart problem.",
    sensitive: true,
    fallbackQuotes: [
      {
        quote:
          "Please help—I’m walking up several times a night DRENCHED in sweat. I can’t regulate my own body temp. I thought the night sweats were supposed to go away after menopause, but they DEFINITELY HAVEN’T.",
        title: "Please help—I’m walking up several times a night DRENCHED in sweat.",
        url: "https://www.reddit.com/r/Menopause/comments/1okae1y/please_helpim_walking_up_several_times_a_night/",
      },
      {
        quote:
          "HRT has helped with hot flashes I don’t get them anymore but I do get night sweats. I have to change clothes in the middle of the night because of it.",
        title: "How to stop night sweats",
        url: "https://www.reddit.com/r/Menopause/comments/1qwmdhf/how_to_stop_night_sweats/",
      },
    ],
    criteria: [
      { slug: "dry", name: "You stay dry", detail: "A night without a full clothing change." },
      { slug: "sleep", name: "You get back to sleep", detail: "The wake should not cost the rest of the night." },
      { slug: "bedding", name: "Bedding you can swap", detail: "A spare set beats a magic fibre." },
      { slug: "clinic", name: "When to get checked", detail: "New, with other symptoms, or off treatment needs a person." },
    ],
    products: [
      {
        slug: "spare-set",
        name: "Spare set and a cooler room",
        summary: "Second pyjamas, second sheet, drop the room a degree. Free-ish and unsexy.",
        whoFor: "Best if you already know you will wake wet some nights.",
        searchQuery: "moisture wicking pajamas night sweats spare sheets",
        priceBand: "£20–£80",
        note: "Cover while you sort hormones or a GP. Not the whole plan.",
        scores: { dry: 62, sleep: 70, bedding: 88, clinic: 50 },
      },
      {
        slug: "clinician",
        name: "GP or menopause clinic",
        summary: "HRT dose, non-hormonal options, or a check that this is not something else.",
        whoFor: "Best if this is new, severe, or you thought it was supposed to be over.",
        searchQuery: "GP menopause clinic night sweats HRT",
        priceBand: "varies",
        note: "Right first move when this is wrecking sleep.",
        scores: { dry: 84, sleep: 82, bedding: 55, clinic: 96 },
      },
      {
        slug: "cooling-sheet",
        name: "Cooling sheet as one lever",
        summary: "Wicks for some people. Easy to buy instead of changing the room or the dose.",
        whoFor: "Best as a trial after a spare set, not as the diagnosis.",
        searchQuery: "cooling sheets night sweats menopause",
        priceBand: "£40–£150",
        note: "Optional. The ads are louder than the evidence.",
        scores: { dry: 58, sleep: 60, bedding: 74, clinic: 35 },
      },
    ],
  },
  {
    categoryId: "cat-shoes",
    clusterSlug: "plantar",
    clusterName: "Plantar",
    clusterSummary: "Heel pain on the first steps of a standing day.",
    slug: "plantar-standing-day",
    title: "Shoes that do not stab the first step",
    h1: "When the first steps of the day stab the heel",
    problem:
      "Getting out of bed hurts. A standing shift makes it worse. People rotate shoes from a 60-thread roundup and still limp to the kettle.",
    analysis:
      "The useful split is load, a shoe with a real sole, and whether this needs a clinician. Cushion without structure is a slipper. Stretch and strength work are slow. This is not the bunion-width page.",
    whyNow:
      "Every standing job googles “best plantar shoe” and gets a listicle.",
    sensitive: true,
    fallbackQuotes: [
      {
        quote:
          "I scraped comments from 60+ reddit threads where people asked “what are the best shoes for plantar fasciitis?” or shared recovery/shoe recs.",
        title: "I analyzed 60+ Reddit threads to find the best shoes for plantar fasciitis",
        url: "https://www.reddit.com/r/PlantarFasciitis/comments/1o36sup/i_analyzed_60_reddit_threads_to_find_the_best/",
      },
      {
        quote:
          "I wanted to share my full recovery story because when I first got plantar fasciitis, I was confused as hell and Reddit helped me a lot.",
        title: "How I Cured My Plantar Fasciitis in 2 Months!! (Long Post)",
        url: "https://www.reddit.com/r/PlantarFasciitis/comments/1qh0ts2/how_i_cured_my_plantar_fasciitis_in_2_months_long/",
      },
    ],
    criteria: [
      { slug: "first-step", name: "First steps", detail: "Getting out of bed should not be the worst moment." },
      { slug: "stand", name: "A standing day", detail: "Hour six on a floor should still be possible." },
      { slug: "daily", name: "You will wear it", detail: "A shoe you can actually work in, not a recovery sandal only." },
      { slug: "clinic", name: "When to get checked", detail: "Months of this, numbness, or a tear story needs a person." },
    ],
    products: [
      {
        slug: "structured-shoe",
        name: "Structured daily shoe",
        summary: "A firm midsole and a drop that does not fold. Not a fluffy slipper.",
        whoFor: "Best if first steps hurt and you stand for work.",
        searchQuery: "plantar fasciitis shoes standing all day",
        priceBand: "£80–£160",
        note: "A tool. Not a cure by itself.",
        scores: { "first-step": 76, stand: 82, daily: 80, clinic: 55 },
      },
      {
        slug: "load-work",
        name: "Calf work and load plan",
        summary: "Slow strength beats another pair if the tissue is the problem.",
        whoFor: "Best if you can do 10 minutes and pain eases as you walk.",
        searchQuery: "plantar fasciitis calf stretch strengthening",
        priceBand: "£0–£40",
        note: "Slow. Highest odds alongside a shoe, not instead of one.",
        scores: { "first-step": 80, stand: 70, daily: 58, clinic: 70 },
      },
      {
        slug: "clinician",
        name: "Physio or podiatry",
        summary: "Rules out a tear, a nerve, or a plan you are guessing wrong.",
        whoFor: "Best if this has lasted months or shoes did nothing.",
        searchQuery: "podiatrist plantar fasciitis standing work",
        priceBand: "varies",
        note: "Right when home care stalls.",
        scores: { "first-step": 84, stand: 78, daily: 55, clinic: 96 },
      },
    ],
  },
  {
    categoryId: "cat-personal-care",
    clusterSlug: "period-leak",
    clusterName: "Period leak",
    clusterSummary: "Blood that misses the pad and runs the thigh.",
    slug: "period-sideways-leak",
    title: "Period protection that holds at the sides",
    h1: "When it leaks sideways, not into the pad",
    problem:
      "The pad is dry in the middle and the thigh is not. Overnight and front leaks wreck sheets. Period underwear often has the same gap.",
    analysis:
      "The useful split is coverage geometry, overnight volume, and whether a cup or disc is acceptable. A thicker pad that is still a skinny island will leak the same way. This is not the incontinence-rustle page and not sneeze-leak.",
    whyNow:
      "People are asking why 360° gussets barely exist, then buying two pads anyway.",
    sensitive: true,
    fallbackQuotes: [
      {
        quote:
          "Why is there no sideways protection in period underwear? When I wear pads or period underwear, i leak down my thighs and it never goes up or down the actual padding.",
        title: "Why is there no sideways protection in period underwear?",
        url: "https://www.reddit.com/r/Periods/comments/1tlwhu7/why_is_there_no_sideways_protection_in_period/",
      },
      {
        quote:
          "Front leaks piss me off so bad. Tried period underwear and the coverage was terrible! Wearing two pads.",
        title: "Front leaks piss me off so bad.",
        url: "https://www.reddit.com/r/Periods/comments/1qlyliw/front_leaks_piss_me_off_so_bad/",
      },
    ],
    criteria: [
      { slug: "side", name: "Holds at the sides", detail: "A thigh should not be the overflow." },
      { slug: "night", name: "Overnight", detail: "A full night without a sheet change." },
      { slug: "wear", name: "You will wear it", detail: "A cup you will not use is not a plan." },
      { slug: "clinic", name: "When to get checked", detail: "Soaking hourly, clots, or sudden change needs a person." },
    ],
    products: [
      {
        slug: "wide-overnight",
        name: "Wide overnight pad or boyshort undies",
        summary: "Coverage at the legs, not a thicker skinny island.",
        whoFor: "Best if the leak is always the thigh, not the centre.",
        searchQuery: "overnight period pad side leak boyshort period underwear",
        priceBand: "£4–£35",
        note: "Geometry first. Absorbency numbers lie if the shape is wrong.",
        scores: { side: 78, night: 80, wear: 82, clinic: 50 },
      },
      {
        slug: "cup-or-disc",
        name: "Cup or disc",
        summary: "Holds inside. Learning curve. Not for everyone.",
        whoFor: "Best if pads keep missing and you will learn the seal.",
        searchQuery: "menstrual disc period cup heavy flow leak",
        priceBand: "£8–£40",
        note: "Highest hold if it fits. Easy to quit in week one.",
        scores: { side: 88, night: 84, wear: 55, clinic: 58 },
      },
      {
        slug: "clinician",
        name: "GP if this is new or extreme",
        summary: "Flooding, clots, or a sudden change is not a shopping problem.",
        whoFor: "Best if you soak hourly or this started out of nowhere.",
        searchQuery: "GP heavy periods soak pad hourly",
        priceBand: "varies",
        note: "Right when volume is the red flag.",
        scores: { side: 70, night: 72, wear: 50, clinic: 96 },
      },
    ],
  },
  {
    categoryId: "cat-clothes",
    clusterSlug: "chafing",
    clusterName: "Chafing",
    clusterSummary: "Inner thighs that burn in heat and short hems.",
    slug: "thigh-chafing-heat",
    title: "Thighs that do not chafe in the heat",
    h1: "When a walk in shorts burns the inner thigh",
    problem:
      "Heat plus a dress or shorts and the inner thigh rubs raw. People hide in biker shorts under everything or stay home.",
    analysis:
      "The useful split is a barrier you will actually wear, vs a powder that fails once you sweat. Biker shorts win and change the look. Bands and sticks are the dress option. This is not a weight-loss page.",
    whyNow:
      "Summer threads ask for a secret that is not “just wear longs”.",
    sensitive: true,
    fallbackQuotes: [
      {
        quote:
          "I also chafe very easily on my inner thighs. I'm still recovering. What are the heat intolerant girlies wearing for summer.",
        title: "What are the heat intolerant girlies wearing for summer lol?",
        url: "https://www.reddit.com/r/PlusSize/comments/1snct60/what_are_the_heat_intolerant_girlies_wearing_for/",
      },
      {
        quote:
          "I always see girls my size or bigger wearing dresses or shorter shorts and I gotta ask, what’s the secret to not chafing without ruining the fit with biker shorts?",
        title: "Dealing with Thigh Chafing",
        url: "https://www.reddit.com/r/PlusSize/comments/1w0is37/dealing_with_thigh_chafing/",
      },
    ],
    criteria: [
      { slug: "rub", name: "No burn", detail: "A walk should not raw the inner thigh." },
      { slug: "heat", name: "Works when sweaty", detail: "Powder that pills after 20 minutes is not a plan." },
      { slug: "look", name: "The outfit still works", detail: "A fix that forces longs every day will be skipped." },
      { slug: "keep", name: "You will reapply", detail: "A stick in the bag beats a perfect cream at home." },
    ],
    products: [
      {
        slug: "shorts",
        name: "Thin bike shorts under",
        summary: "Highest odds. Changes the silhouette.",
        whoFor: "Best if you will wear a layer and want zero rub.",
        searchQuery: "anti chafe bike shorts under dress",
        priceBand: "£8–£25",
        note: "Ugly-on-purpose. Usually the actual answer.",
        scores: { rub: 92, heat: 80, look: 48, keep: 78 },
      },
      {
        slug: "stick",
        name: "Anti-chafe stick or band",
        summary: "Keeps a dress. Fails if you forget to reapply.",
        whoFor: "Best if the outfit cannot hide shorts.",
        searchQuery: "anti chafe stick thigh bands",
        priceBand: "£6–£18",
        note: "The dress option. Not sweat-proof magic.",
        scores: { rub: 74, heat: 62, look: 84, keep: 60 },
      },
      {
        slug: "powder",
        name: "Powder or cream",
        summary: "Cheap. Washes off with sweat faster than people admit.",
        whoFor: "Best for a short outing, not a humid day out.",
        searchQuery: "anti chafe powder inner thigh",
        priceBand: "£3–£10",
        note: "Backup. Easy to over-trust.",
        scores: { rub: 50, heat: 40, look: 80, keep: 55 },
      },
    ],
  },
  {
    categoryId: "cat-personal-care",
    clusterSlug: "curly-hair",
    clusterName: "Curly hair",
    clusterSummary: "Definition that dies the minute humidity hits.",
    slug: "curls-die-humidity",
    title: "Curls that hold when the air is wet",
    h1: "When humidity deletes the curl by lunch",
    problem:
      "It looks defined while drying. Outside, wind and moisture turn it into a halo. Leave-in that worked in winter goes greasy in summer.",
    analysis:
      "The useful split is hold vs weight. More cream in humidity often makes the collapse worse. A lighter routine plus a gel cast beats another holy-grail butter. This is not a hair-loss page.",
    whyNow:
      "Product aisles restart every summer, and humidity is treated as a shopping problem.",
    sensitive: false,
    fallbackQuotes: [
      {
        quote:
          "my hair will not retain definition in humid/windy weather. it looks really defined when it’s drying and indoors.",
        title: "my hair will not retain definition in humid/windy weather",
        url: "https://www.reddit.com/r/curlyhair/comments/1o4voot/my_hair_will_not_retain_definition_in_humidwindy/",
      },
      {
        quote:
          "basically title—i’m living in scotland where it’s quite windy and moist so my hair looks really defined when it’s drying and indoors.",
        title: "my hair will not retain definition in humid/windy weather",
        url: "https://www.reddit.com/r/curlyhair/comments/1o4voot/my_hair_will_not_retain_definition_in_humidwindy/",
      },
    ],
    criteria: [
      { slug: "hold", name: "Holds outside", detail: "Definition should survive a damp walk, not just the bathroom." },
      { slug: "weight", name: "Not greasy", detail: "A cast should not look oily by noon." },
      { slug: "time", name: "A routine you will do", detail: "A 12-product wash day will be skipped on a work morning." },
      { slug: "cost", name: "Cost to experiment", detail: "You should not need a new bottle every humidity spike." },
    ],
    products: [
      {
        slug: "lighter-gel",
        name: "Lighter leave-in, stronger gel",
        summary: "Drop the heavy cream in summer. Let a gel cast do the weather work.",
        whoFor: "Best if winter cream is the thing going greasy.",
        searchQuery: "curly hair gel humidity no heavy leave in",
        priceBand: "£6–£20",
        note: "First move. Less product, not more.",
        scores: { hold: 80, weight: 84, time: 70, cost: 75 },
      },
      {
        slug: "refresh",
        name: "Water refresh, not a full rewash",
        summary: "Damp, scrunch, a bit of gel. Saves the afternoon.",
        whoFor: "Best if mornings look fine and the commute ruins it.",
        searchQuery: "curly hair humidity refresh spray gel",
        priceBand: "£0–£12",
        note: "A habit. Not a new identity.",
        scores: { hold: 72, weight: 78, time: 82, cost: 88 },
      },
      {
        slug: "humectant-stack",
        name: "Another moisture stack",
        summary: "More butters in wet air. Often the collapse.",
        whoFor: "Best if hair is actually crispy-dry, not humidity-frizz.",
        searchQuery: "curly hair leave in butter humidity",
        priceBand: "£8–£25",
        note: "The aisle default. Often the wrong season.",
        scores: { hold: 40, weight: 32, time: 50, cost: 45 },
      },
    ],
  },
  {
    categoryId: "cat-personal-care",
    clusterSlug: "dry-eyes",
    clusterName: "Dry eyes",
    clusterSummary: "Screens and contacts that leave the eyes burning.",
    slug: "dry-eyes-screens",
    title: "Eyes that last a screen day",
    h1: "When screens leave your eyes burning",
    problem:
      "Drops last an hour. Contacts come out early. People rank three years of gadgets and still sit in the dark after work.",
    analysis:
      "The useful split is lids, humidity, and whether this needs a clinic. Preservative-free drops are a tool, not a diagnosis. A screen break is free and skipped. This is not an eye-drop miracle page.",
    whyNow:
      "Desk days are long, and dry-eye devices are easy to click before anyone looks at the lids.",
    sensitive: true,
    fallbackQuotes: [
      {
        quote:
          "About two years ago, I was diagnosed with aqueous-deficient dry eye combined with meibomian gland dysfunction. At its worst, dry eye affected almost every part of the day.",
        title: "My chronic dry eye is about 80% better. Here are some things that actually helped me.",
        url: "https://www.reddit.com/r/Dryeyes/comments/1v6vr8m/my_chronic_dry_eye_is_about_80_better_here_are/",
      },
      {
        quote:
          "You don’t realise how primitive modern medicine still is until you get dry eyes.",
        title: "You don’t realise how primitive modern medicine still is until you get dry eyes",
        url: "https://www.reddit.com/r/Dryeyes/comments/1uoa33i/you_dont_realise_how_primitive_modern_medicine/",
      },
    ],
    criteria: [
      { slug: "burn", name: "Burn calms", detail: "Evening should not feel like sand." },
      { slug: "screen", name: "A screen day", detail: "Work should be possible without sitting in the dark." },
      { slug: "daily", name: "You will do it", detail: "Lids and breaks beat a device you will not charge." },
      { slug: "clinic", name: "When to get checked", detail: "Pain, light stabbing, or sudden change needs a person." },
    ],
    products: [
      {
        slug: "lids-breaks",
        name: "Lid care and screen breaks",
        summary: "Warmth, lid hygiene, blinks, humidifier. Slow and free-ish.",
        whoFor: "Best if this tracks desk hours and you have not tried lids yet.",
        searchQuery: "meibomian gland lid hygiene dry eyes computer",
        priceBand: "£0–£25",
        note: "First move in that sub for a reason.",
        scores: { burn: 78, screen: 74, daily: 58, clinic: 70 },
      },
      {
        slug: "pf-drops",
        name: "Preservative-free drops",
        summary: "A tool for the day. Preserved bottles can sting more with overuse.",
        whoFor: "Best as cover during the screen day, not as the only plan.",
        searchQuery: "preservative free lubricating eye drops dry eyes",
        priceBand: "£6–£18",
        note: "Useful. Easy to live on drops and skip lids.",
        scores: { burn: 70, screen: 72, daily: 80, clinic: 50 },
      },
      {
        slug: "clinic",
        name: "Optometrist or clinic",
        summary: "MGD, aqueous deficiency, or something drops will not touch.",
        whoFor: "Best if this has lasted months or light is painful.",
        searchQuery: "optometrist dry eye clinic MGD",
        priceBand: "varies",
        note: "Right when home care stalls.",
        scores: { burn: 86, screen: 80, daily: 55, clinic: 96 },
      },
    ],
  },
  {
    categoryId: "cat-clothes",
    clusterSlug: "bras",
    clusterName: "Bras",
    clusterSummary: "Straps that dig and cups that only come in lace.",
    slug: "bra-straps-dig",
    title: "A bra that holds without digging in",
    h1: "When the straps dig and the cups are a costume",
    problem:
      "The calculator size is right and the straps still carve. Shops push a bigger band. Large cups arrive covered in lace or not at all.",
    analysis:
      "The useful split is support engineering vs decoration. A calculator is a start, not a cure for weight on the shoulders. Wider straps and a firmer band beat another plunge. This is not a “love your body” page.",
    whyNow:
      "Fit content is everywhere, and people with large cups still cannot buy a plain beige bra.",
    sensitive: true,
    fallbackQuotes: [
      {
        quote:
          "Where can I find a bra that isn’t decorated like a Christmas tree? I’m a 34M (US) or 34J (UK). That size is already really hard to find.",
        title: "Where can I find a bra that isn’t decorated like a Christmas tree?",
        url: "https://www.reddit.com/r/ABraThatFits/comments/1rlra9n/where_can_i_find_a_bra_that_isnt_decorated_like_a/",
      },
      {
        quote:
          "Can we stop acting like wearing the right sized bra will magically solve all your problems. For some people, no matter how the weight is redistributed, the straps still dig.",
        title: "Can we stop acting like wearing the right sized bra will magically solve all your problems",
        url: "https://www.reddit.com/r/bigboobproblems/comments/1uxf3gf/can_we_stop_acting_like_wearing_the_right_sized/",
      },
    ],
    criteria: [
      { slug: "dig", name: "Straps do not carve", detail: "End of day should not show grooves." },
      { slug: "hold", name: "It actually holds", detail: "The band should do the work, not the neck." },
      { slug: "plain", name: "You can wear it daily", detail: "A lace costume is not a work bra." },
      { slug: "fit", name: "Size is honest", detail: "A fitter who sizes you into commission is not a fit." },
    ],
    products: [
      {
        slug: "wide-strap",
        name: "Wide-strap, firm-band bra",
        summary: "Support first, decoration last. Try the calculator size in a sports-adjacent cut.",
        whoFor: "Best if straps carve and the band rides up.",
        searchQuery: "wide strap full coverage bra large cup",
        priceBand: "£35–£80",
        note: "Start here. Not a boutique lace set.",
        scores: { dig: 82, hold: 84, plain: 70, fit: 75 },
      },
      {
        slug: "calculator-refit",
        name: "Refit with the calculator, then a specialist",
        summary: "A real size, then a shop that stocks it. Skip the commission fitter.",
        whoFor: "Best if you have never measured and everything feels random.",
        searchQuery: "ABTF calculator bra specialist large cup",
        priceBand: "£0–£80",
        note: "Information is free. The bra still has to exist in your size.",
        scores: { dig: 70, hold: 78, plain: 60, fit: 90 },
      },
      {
        slug: "sports-daily",
        name: "High-support sports as a daily",
        summary: "Ugly and often the only thing that holds. Not breathable for a heatwave.",
        whoFor: "Best if fashion bras all fail and you need a workday.",
        searchQuery: "high impact sports bra large cup daily wear",
        priceBand: "£25–£55",
        note: "A workaround. Easy to live in forever.",
        scores: { dig: 76, hold: 88, plain: 80, fit: 65 },
      },
    ],
  },
  {
    categoryId: "cat-personal-care",
    clusterSlug: "sneeze-leak",
    clusterName: "Sneeze leak",
    clusterSummary: "Leak on sneeze, cough, or a run. Not pad rustle.",
    slug: "leak-when-running",
    title: "Protection that holds on a run",
    h1: "When a run is enough to leak",
    problem:
      "A 5k leaves a spot. Pads shift. People stop signing up, or they hunt a product that will not rustle and will not fall out of running shorts.",
    analysis:
      "The useful split is pelvic-floor work, a run-specific backup, and whether this needs a clinician. A liner made for sitting will migrate. This sits with sneeze-leak, not with quiet underwear.",
    whyNow:
      "Runners are asking in public because race-day leak is still treated as a private shopping problem.",
    sensitive: true,
    fallbackQuotes: [
      {
        quote:
          "TMI: Recs for Incontinence Products for Running. Yep, I know, it’s a sensitive TMI kind of subject, but I know I’m not the only one suffering.",
        title: "TMI: Recs for Incontinence Products for Running",
        url: "https://www.reddit.com/r/running/comments/1tgqlzp/tmi_recs_for_incontinence_products_for_running/",
      },
      {
        quote:
          "I’m a causal runner, but over the years I’ve run a bunch of 5ks. I know I’m not the only one suffering.",
        title: "TMI: Recs for Incontinence Products for Running",
        url: "https://www.reddit.com/r/running/comments/1tgqlzp/tmi_recs_for_incontinence_products_for_running/",
      },
    ],
    criteria: [
      { slug: "hold", name: "Holds on a run", detail: "Impact should not leave a spot." },
      { slug: "stay", name: "Stays put", detail: "A pad that bunches in shorts is not cover." },
      { slug: "train", name: "You will train the floor", detail: "Cover without work is a stall." },
      { slug: "clinic", name: "When to get checked", detail: "New, painful, or getting worse needs a person." },
    ],
    products: [
      {
        slug: "physio",
        name: "Pelvic-floor physio",
        summary: "Taught work for impact leak. Slow. Highest odds if this is stress leak.",
        whoFor: "Best if leak is on jump or run and you can do daily work.",
        searchQuery: "pelvic floor physiotherapy leak when running",
        priceBand: "£40–£90",
        note: "Same missing step as sneeze-leak.",
        scores: { hold: 86, stay: 70, train: 72, clinic: 78 },
      },
      {
        slug: "run-liner",
        name: "Secure run liner or short",
        summary: "Built to stay in motion. Cover, not a cure.",
        whoFor: "Best as race-day backup while you train.",
        searchQuery: "incontinence running shorts leak proof run",
        priceBand: "£8–£40",
        note: "Useful cover. Easy to stop there.",
        scores: { hold: 62, stay: 84, train: 30, clinic: 40 },
      },
      {
        slug: "clinician",
        name: "GP or continence clinic",
        summary: "Rules out something exercises will not touch.",
        whoFor: "Best if this is new, painful, or getting worse.",
        searchQuery: "GP continence clinic leak when running",
        priceBand: "varies",
        note: "Right when red flags are present.",
        scores: { hold: 80, stay: 55, train: 50, clinic: 96 },
      },
    ],
  },
];
