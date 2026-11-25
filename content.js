/**
 * content.js
 * All copy, hotspot coordinates, and configuration live in this single file.
 * Separating content from behavior keeps the experience easy to audit and edit
 * without touching interaction logic.
 */

/* Leave empty unless a direct contact address is provided; never invent one. */
const CONTACT_EMAIL = "";

window.TREE_CONTENT = {
  contactEmail: CONTACT_EMAIL,

  meta: {
    name: "Soniaa S.",
    role: "Fractional CMO",
    hint: "You're the butterfly. Drift toward what draws you.",
    mobileHint: "Swipe to explore",
    finishLink: "Finish my visit",
    backLink: "Back to the tree",
    budTooltip: "Still growing: a next experiment.",
    leafPlaceholder: "What stood out to you?",
    leafButton: "Leave a leaf",
    leafMaxLength: 280,
    totalOpenBranches: 3,
    totalBudBranches: 4,
    linkedinUrl: "https://www.linkedin.com/in/soniaspecialist/",
  },

  /* Image aspect ratio (2272 x 1884) so the stage wraps the drawing tightly. */
  stage: {
    width: 2272,
    height: 1884,
    groundLinePct: 62,
  },

  /**
   * Coordinates are percentages of the image wrapper (x% from left, y% from top),
   * measured directly from the seven drawn diamond/circle tips in the sketch.
   * Use ?debug=1 to inspect, drag, and copy updated coordinates.
   */
  hotspots: [
    {
      id: "crown",
      x: 45.5,
      y: 4.5,
      title: "The Whole Picture",
      status: "open",
      bloomColor: "amber",
      ariaLabel: "The Whole Picture — open branch",
    },
    {
      id: "upperLeft",
      x: 16.4,
      y: 16.1,
      title: "The Noticing",
      status: "open",
      bloomColor: "sage",
      ariaLabel: "The Noticing — open branch",
    },
    {
      id: "upperRight",
      x: 84.4,
      y: 22.1,
      title: "The Canopy",
      status: "bud",
      bloomColor: "rose",
      ariaLabel: "The Canopy — bud, still growing",
    },
    {
      id: "midLeft",
      x: 14.7,
      y: 42.5,
      title: "How she leads",
      status: "bud",
      bloomColor: "sage",
      ariaLabel: "How she leads — bud, still growing",
    },
    {
      id: "midRight",
      x: 83.2,
      y: 41.4,
      title: "How she solves things",
      status: "bud",
      bloomColor: "amber",
      ariaLabel: "How she solves things — bud, still growing",
    },
    {
      id: "rootLeft",
      x: 30.1,
      y: 87.2,
      title: "The Roots",
      status: "open",
      bloomColor: "rose",
      ariaLabel: "The Roots — open root",
    },
    {
      id: "rootRight",
      x: 70.2,
      y: 89.6,
      title: "What she cares about",
      status: "bud",
      bloomColor: "sage",
      ariaLabel: "What she cares about — bud, still growing",
    },
  ],

  sections: {
    crown: {
      title: "The Whole Picture",
      headline: "Seeing the whole picture",
      nodes: [
        {
          id: "brand",
          label: "Brand → Revenue",
          detail: "Brand affects revenue.",
          x: 22,
          y: 24,
        },
        {
          id: "messaging",
          label: "Messaging → Conversion",
          detail: "Messaging affects conversion.",
          x: 78,
          y: 24,
        },
        {
          id: "operations",
          label: "Operations → Execution",
          detail: "Operations affect execution.",
          x: 24,
          y: 78,
        },
        {
          id: "people",
          label: "People → Everything",
          detail: "People affect everything.",
          x: 76,
          y: 76,
          connectsAll: true,
        },
      ],
      /* Loose network edges between node ids; hovering People lights every edge. */
      edges: [
        ["brand", "messaging"],
        ["brand", "operations"],
        ["messaging", "operations"],
        ["people", "brand"],
        ["people", "messaging"],
        ["people", "operations"],
      ],
    },

    upperLeft: {
      title: "The Noticing",
      attribution: "In her own words",
      /* Segmented so the three target phrases remain plain text in the DOM while interactively focusing. */
      quoteParts: [
        { text: "I notice what others don't. ", focusable: false },
        { text: "The gaps", focusable: true, id: "gaps" },
        { text: ", ", focusable: false },
        { text: "the confusion", focusable: true, id: "confusion" },
        { text: ", ", focusable: false },
        { text: "the unspoken story", focusable: true, id: "unspoken" },
        { text: ", and I help make sense of it.", focusable: false },
      ],
    },

    rootLeft: {
      title: "The Roots",
      headline: "The Roots",
      items: [
        "IIM Bangalore — Executive MBA, Marketing, 2007–2008",
        "Symbiosis Institute of Management Studies — PGDBM, Marketing & Sales, 2007–2009",
      ],
      note: "Two of five educations shown.",
    },
  },

  ending: {
    headline: "Your visit",
    summaryTemplate:
      "You explored {n} of 3 open branches. 4 are still growing.",
    emptyNotesText: "No leaves left yet.",
    sendButtonLabel: "Send Soniaa what stood out",
    copyButtonLabel: "Copy my notes",
    copiedLabel: "Copied",
    linkedinLabel: "Open her LinkedIn",
    clearLabel: "Clear my notes",
    footerNote: "Notes stay in your browser and disappear when you leave.",
  },
};
