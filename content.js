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
    mobileHint: "Swipe to explore",
    finishLink: "Finish my visit",
    backLink: "Back to the tree",
    budTooltip: "Still growing: a next experiment.",
    leafPlaceholder: "'Leaf' your remarks here",
    leafButton: "Leave a leaf",
    leafMaxLength: 280,
    totalOpenBranches: 7,
    totalBudBranches: 0,
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
      title: "The Journey",
      status: "open",
      bloomColor: "rose",
      ariaLabel: "The Journey — open branch",
    },
    {
      id: "midLeft",
      x: 14.7,
      y: 42.5,
      title: "The Problem Solving",
      status: "open",
      bloomColor: "blue",
      ariaLabel: "The Problem Solving — open branch",
    },
    {
      id: "midRight",
      x: 83.2,
      y: 41.4,
      title: "The Guiding",
      status: "open",
      bloomColor: "sage",
      ariaLabel: "The Guiding — open branch",
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
      title: "The Roots",
      status: "open",
      bloomColor: "sage",
      ariaLabel: "The Roots — open root",
    },
  ],

  sections: {
    crown: {
      title: "The Whole Picture",
      headlineParts: [
        { text: "strength isn’t just one skill or expertise", italic: true },
        { text: " but it lies in seeing the whole picture", italic: false },
      ],
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
      education: {
        school: "IIM Bangalore",
        degree: "Executive MBA, Marketing",
        years: "2007 – 2008",
        activities:
          "Activities and societies: Worked on a Project of Strategies with CM University",
      },
    },

    upperRight: {
      title: "The Journey",
      items: [
        {
          company: "Celestial AI",
          role: "Chief Marketing & Operations Advisor",
        },
        {
          company: "AYU Lifescience",
          role: "Fractional Marketing Lead",
        },
        {
          company: "i-SmokeStack",
          role: "Chief Marketing Officer",
        },
        {
          company: "Datt Mediproducts Pvt. Ltd.",
          role: "Fractional CMO",
        },
      ],
    },

    rootRight: {
      title: "The Roots",
      education: {
        school: "Symbiosis Institute of Management Studies",
        degree: "PGDBM, Marketing & Sales",
        years: "2007 – 2009",
        activities:
          "Activities and societies: Active Participations in Personal Development programs..",
      },
    },

    midRight: {
      title: "The Guiding",
      recommendations: [
        {
          author: "Dr Dhaval Mody",
          context:
            "April 13, 2021, Dr Dhaval worked with Soniaa but on different teams",
          quote:
            "An expert in digital and social media marketing. A Hubspot pro. Very proactive, a go-getter who leaves no stone unturned to get work done. Is a team player and a team builder.",
        },
        {
          author: "Krittika Sharma",
          context:
            "March 24, 2020, Krittika worked with Soniaa but on different teams",
          quote:
            "I have worked closely with Sonia for the past year and a half. As a team that works remotely, I have had the pleasure to work with her and her team to learn marketing tools for our global requirements. Sonia is a natural leader who is patient and believes in bringing out the best in her team as well as the teams she supports. She encourages learning and enjoys striving for efficiency in the projects. She brings a high level of quality and has experience working at a national and a global level. She is prompt, clear, finds solutions with ease, hardworking, and seeks her own growth to ensure that her leadership...",
        },
      ],
    },
    midLeft: {
      title: "The Problem Solving",
      seeds: [
        { label: "Marketing Strategy", x: 24, y: 12, rot: -4, tint: "chestnut", flip: false },
        { label: "Email Marketing", x: 75, y: 14, rot: 3.2, tint: "almond", flip: true },
        { label: "Training", x: 49, y: 27, rot: -2, tint: "walnut", flip: false },
        { label: "Brand Consulting", x: 21, y: 40, rot: 3.5, tint: "hazelnut", flip: true },
        { label: "Content Strategy", x: 77, y: 42, rot: -3, tint: "walnut", flip: false },
        { label: "Team Building", x: 48, y: 55, rot: 2.2, tint: "almond", flip: true },
        { label: "Brand Marketing", x: 22, y: 69, rot: -2.8, tint: "chestnut", flip: false },
        { label: "Demand Generation", x: 76, y: 71, rot: 2.6, tint: "hazelnut", flip: true },
        { label: "Leadership Development", x: 25, y: 86, rot: 1.8, tint: "almond", flip: false },
        { label: "Management Consulting", x: 75, y: 88, rot: -2.4, tint: "walnut", flip: true },
      ],
    },
  },

  ending: {
    headline: "Your visit",
    summaryTemplate: "You explored {n} of 7 open branches.",
    emptyNotesText: "No leaves left yet.",
    sendButtonLabel: "Send Soniaa what stood out",
    copyButtonLabel: "Copy my notes",
    copiedLabel: "Copied",
    linkedinLabel: "Open her LinkedIn",
    clearLabel: "Clear my notes",
    footerNote: "Notes stay in your browser and disappear when you leave.",
  },
};
