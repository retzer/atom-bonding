import type { ReactionActionType } from "../types";

export type ReactionExpansionId =
  | "fundamentals"
  | "organic-essentials"
  | "electron-mechanics"
  | "advanced-organic"
  | "polymer-materials"
  | "biochemistry"
  | "inorganic-coordination"
  | "electrochem-energy";
export type ReactionFamilyStatus = "implemented" | "staged";

export type ReactionFamily = {
  id: string;
  expansion: ReactionExpansionId;
  label: string;
  status: ReactionFamilyStatus;
  primitiveActions: ReactionActionType[];
  electronFirst: boolean;
  requires?: string[];
  implementedVia?: string;
  blockedReason?: string;
  domainNotes?: string;
};

export const reactionFamilies: ReactionFamily[] = [
  family("protonation", "fundamentals", "Protonation", "implemented", ["protonate"]),
  family("deprotonation", "fundamentals", "Deprotonation", "implemented", ["deprotonate"]),
  family("bond-formation", "fundamentals", "Bond formation", "implemented", ["form-bond"]),
  family("bond-breaking", "fundamentals", "Bond breaking", "implemented", ["break-bond"]),
  family("bond-order-change", "fundamentals", "Bond order change", "implemented", ["increase-bond-order", "decrease-bond-order"]),
  family("electron-transfer", "fundamentals", "Electron transfer", "implemented", ["nucleophile-attack", "break-bond"]),
  family("proton-transfer", "fundamentals", "Proton transfer", "implemented", ["protonate", "deprotonate"]),
  family("nucleophilic-attack", "fundamentals", "Nucleophilic attack", "implemented", ["nucleophile-attack"]),
  family("electrophilic-attack", "fundamentals", "Electrophilic attack", "implemented", ["nucleophile-attack"]),
  family("resonance-shift", "fundamentals", "Resonance shift", "staged", ["increase-bond-order", "decrease-bond-order"]),
  family("tautomerization", "fundamentals", "Tautomerization", "staged", ["protonate", "deprotonate", "increase-bond-order", "decrease-bond-order"]),
  family("hydration", "fundamentals", "Hydration", "staged", ["nucleophile-attack", "protonate"]),
  family("dehydration", "fundamentals", "Dehydration", "staged", ["deprotonate", "break-bond"]),
  family("hydrolysis", "fundamentals", "Hydrolysis", "staged", ["nucleophile-attack", "break-bond"]),
  family("condensation", "fundamentals", "Condensation", "staged", ["form-bond", "break-bond"]),
  family("oxidation", "fundamentals", "Oxidation", "staged", ["increase-bond-order", "decrease-bond-order"]),
  family("reduction", "fundamentals", "Reduction", "staged", ["decrease-bond-order"]),
  staged("sn1", "organic-essentials", "SN1 substitution"),
  staged("sn2", "organic-essentials", "SN2 substitution"),
  staged("e1", "organic-essentials", "E1 elimination"),
  staged("e2", "organic-essentials", "E2 elimination"),
  staged("addition", "organic-essentials", "Addition reaction"),
  staged("esterification", "organic-essentials", "Esterification"),
  staged("amidation", "organic-essentials", "Amidation"),
  staged("hydrogenation", "organic-essentials", "Hydrogenation"),
  staged("halogenation", "organic-essentials", "Halogenation"),
  staged("nitration", "organic-essentials", "Nitration"),
  staged("alkylation", "organic-essentials", "Alkylation"),
  staged("acylation", "organic-essentials", "Acylation"),
  staged("cyclization", "organic-essentials", "Cyclization"),
  staged("ring-opening", "organic-essentials", "Ring opening"),
  staged("rearrangement", "organic-essentials", "Rearrangement"),
  staged("keto-enol-tautomerization", "organic-essentials", "Keto-enol tautomerization"),
  staged("homolytic-cleavage", "electron-mechanics", "Homolytic cleavage"),
  staged("heterolytic-cleavage", "electron-mechanics", "Heterolytic cleavage"),
  staged("radical-formation", "electron-mechanics", "Radical formation"),
  staged("radical-substitution", "electron-mechanics", "Radical substitution"),
  staged("radical-addition", "electron-mechanics", "Radical addition"),
  staged("resonance-delocalization", "electron-mechanics", "Resonance delocalization"),
  staged("conjugation", "electron-mechanics", "Conjugation"),
  staged("aromatic-substitution", "electron-mechanics", "Aromatic substitution"),
  staged("aromatic-addition", "electron-mechanics", "Aromatic addition"),
  staged("hybridization-change", "electron-mechanics", "Hybridization change"),
  staged("dipole-redistribution", "electron-mechanics", "Dipole redistribution"),
  staged("aldol", "advanced-organic", "Aldol condensation"),
  staged("claisen", "advanced-organic", "Claisen condensation"),
  staged("michael-addition", "advanced-organic", "Michael addition"),
  staged("grignard", "advanced-organic", "Grignard addition"),
  staged("diels-alder", "advanced-organic", "Diels-Alder cycloaddition"),
  staged("wittig", "advanced-organic", "Wittig reaction"),
  staged("friedel-crafts-alkylation", "advanced-organic", "Friedel-Crafts alkylation"),
  staged("friedel-crafts-acylation", "advanced-organic", "Friedel-Crafts acylation"),
  staged("hydroboration-oxidation", "advanced-organic", "Hydroboration-oxidation"),
  staged("oxymercuration-demercuration", "advanced-organic", "Oxymercuration-demercuration"),
  staged("epoxidation", "advanced-organic", "Epoxidation"),
  staged("ozonolysis", "advanced-organic", "Ozonolysis"),
  staged("reductive-amination", "advanced-organic", "Reductive amination"),
  staged("acetal-formation", "advanced-organic", "Acetal formation"),
  staged("hemiacetal-formation", "advanced-organic", "Hemiacetal formation"),
  staged("addition-polymerization", "polymer-materials", "Addition polymerization"),
  staged("condensation-polymerization", "polymer-materials", "Condensation polymerization"),
  staged("chain-initiation", "polymer-materials", "Chain initiation"),
  staged("chain-propagation", "polymer-materials", "Chain propagation"),
  staged("chain-termination", "polymer-materials", "Chain termination"),
  staged("cross-linking", "polymer-materials", "Cross-linking"),
  staged("depolymerization", "polymer-materials", "Depolymerization"),
  staged("crystallization", "polymer-materials", "Crystallization"),
  staged("phase-transition", "polymer-materials", "Phase transition"),
  staged("adsorption-desorption", "polymer-materials", "Adsorption/desorption"),
  family("peptide-bond-formation", "biochemistry", "Peptide bond formation", "implemented", ["form-bond", "break-bond"], {
    requires: ["amine nucleophile", "carboxyl or activated carbonyl electrophile"],
    implementedVia: "Condensation-style electron movement: nucleophilic attack plus leaving-group bond break preview.",
    domainNotes: "V1 is qualitative and shows amide-forming consequences without modeling enzymes or coupling reagents."
  }),
  family("peptide-hydrolysis", "biochemistry", "Peptide hydrolysis", "implemented", ["nucleophile-attack", "break-bond"], {
    requires: ["amide bond", "water or hydroxide-like oxygen source"],
    implementedVia: "Hydrolysis-style electron movement with carbonyl attack and C-N bond cleavage preview.",
    domainNotes: "V1 focuses on the electron path and product-side bond changes, not pH-specific kinetics."
  }),
  family("glycosidic-bond-formation", "biochemistry", "Glycosidic bond formation", "implemented", ["form-bond", "break-bond"], {
    requires: ["anomeric carbon-like electrophile", "alcohol oxygen donor"],
    implementedVia: "Oxygen lone-pair to carbon target, followed by condensation-style leaving-group preview.",
    domainNotes: "V1 treats this as carbohydrate C-O bond formation without stereochemical enforcement."
  }),
  family("phosphorylation", "biochemistry", "Phosphorylation", "implemented", ["nucleophile-attack", "form-bond"], {
    requires: ["oxygen or nitrogen donor", "phosphorus electrophile"],
    implementedVia: "Lone-pair attack into phosphorus with coordinate/polar bond formation and charge feedback.",
    domainNotes: "ATP bookkeeping is staged; V1 shows the local phosphate-transfer bond event."
  }),
  family("dephosphorylation", "biochemistry", "Dephosphorylation", "implemented", ["break-bond", "deprotonate"], {
    requires: ["P-O or P-N phosphate bond"],
    implementedVia: "Bond cleavage plus proton-transfer-style charge relaxation.",
    domainNotes: "V1 provides local bond/charge consequences, not enzyme-specific pathways."
  }),
  staged("atp-hydrolysis", "biochemistry", "ATP hydrolysis", {
    blockedReason: "ATP hydrolysis needs a polyphosphate substrate model and energy-coupled product bookkeeping."
  }),
  staged("enzyme-catalysis", "biochemistry", "Enzyme catalysis", {
    blockedReason: "Enzyme catalysis needs binding pockets, catalytic residues, and pathway-specific rate effects."
  }),
  staged("fermentation", "biochemistry", "Fermentation", {
    blockedReason: "Fermentation is a pathway-level process and needs multi-step metabolic state support."
  }),
  family("dna-base-pairing", "biochemistry", "DNA base pairing", "implemented", ["form-bond"], {
    requires: ["hydrogen-bond donors and acceptors"],
    implementedVia: "Hydrogen-bond annotation and polarity feedback between paired donor/acceptor sites.",
    domainNotes: "V1 shows base-pairing interactions qualitatively; nucleotide sequence modeling remains staged."
  }),
  staged("denaturation", "biochemistry", "Denaturation", {
    blockedReason: "Denaturation needs secondary/tertiary structure and temperature-dependent noncovalent disruption."
  }),
  staged("transamination", "biochemistry", "Transamination", {
    blockedReason: "Transamination needs imine/enzyme cofactor support before it can be deterministic."
  }),
  staged("methylation", "biochemistry", "Methylation", {
    blockedReason: "Methylation needs methyl donor templates and leaving-group rules."
  }),
  family("coordination-complex-formation", "inorganic-coordination", "Coordination complex formation", "implemented", ["form-bond", "nucleophile-attack"], {
    requires: ["transition/lanthanide/actinide metal center", "lone-pair donor ligand"],
    implementedVia: "Ligand lone pair to metal center with coordinate bond display and coordination-count checks.",
    domainNotes: "V1 uses qualitative coordination limits rather than full ligand-field theory."
  }),
  family("ligand-substitution", "inorganic-coordination", "Ligand substitution", "implemented", ["form-bond", "break-bond"], {
    requires: ["metal complex", "incoming ligand", "leaving ligand"],
    implementedVia: "Incoming coordinate bond formation plus selected coordinate bond cleavage.",
    domainNotes: "V1 is stepwise and explicit; associative/dissociative kinetics are not inferred."
  }),
  family("chelation", "inorganic-coordination", "Chelation", "implemented", ["form-bond"], {
    requires: ["multi-donor ligand", "metal center with open coordination site"],
    implementedVia: "Multiple coordinate-bond previews against the same metal center with stability feedback.",
    domainNotes: "V1 highlights chelate-like multi-donor binding without ring-strain energetics."
  }),
  staged("oxidative-addition", "inorganic-coordination", "Oxidative addition", {
    blockedReason: "Oxidative addition needs oxidation-state bookkeeping and organometallic substrate templates."
  }),
  staged("reductive-elimination", "inorganic-coordination", "Reductive elimination", {
    blockedReason: "Reductive elimination needs paired ligand coupling and metal oxidation-state updates."
  }),
  staged("transmetallation", "inorganic-coordination", "Transmetallation", {
    blockedReason: "Transmetallation needs two coordinated metal centers and ligand-transfer rules."
  }),
  staged("c-h-activation", "inorganic-coordination", "C-H activation", {
    blockedReason: "C-H activation needs organometallic oxidative-addition/proton-transfer coupling."
  }),
  family("complex-dissociation", "inorganic-coordination", "Complex dissociation", "implemented", ["break-bond"], {
    requires: ["coordinate bond"],
    implementedVia: "Coordinate bond cleavage with ligand/metal charge and stability feedback.",
    domainNotes: "V1 models dissociation as an explicit selected-bond step."
  }),
  family("ionization", "inorganic-coordination", "Ionization", "implemented", ["break-bond", "deprotonate"], {
    requires: ["ionic or polar bond", "selected leaving ion/proton site"],
    implementedVia: "Bond cleavage or proton-transfer primitive with formal-charge feedback.",
    domainNotes: "V1 shows local ion generation, not solvent-separated ion-pair dynamics."
  }),
  staged("precipitation-reaction", "inorganic-coordination", "Precipitation reaction", {
    blockedReason: "Precipitation needs solubility rules and ionic lattice/product phase support."
  }),
  family("redox-reaction", "electrochem-energy", "Redox reaction", "implemented", ["nucleophile-attack", "break-bond"], {
    requires: ["electron-rich source", "electron-poor target"],
    implementedVia: "Electron-transfer preview with formal-charge and local stability feedback.",
    domainNotes: "V1 tracks qualitative electron movement, not balanced half-reactions."
  }),
  staged("electrolysis", "electrochem-energy", "Electrolysis", {
    blockedReason: "Electrolysis needs electrodes, external potential, and compartment-level species tracking."
  }),
  staged("galvanic-cell-reaction", "electrochem-energy", "Galvanic cell reaction", {
    blockedReason: "Galvanic cells need half-cell separation, electrode potentials, and ion-flow state."
  }),
  family("proton-coupled-electron-transfer", "electrochem-energy", "Proton-coupled electron transfer", "implemented", ["protonate", "deprotonate", "nucleophile-attack"], {
    requires: ["electron source", "proton source or acceptor"],
    implementedVia: "Paired electron-source movement and proton-transfer primitives shown as one mechanism family.",
    domainNotes: "V1 explains coupled local movement without computing redox potentials."
  }),
  staged("oxidative-phosphorylation", "electrochem-energy", "Oxidative phosphorylation", {
    blockedReason: "Oxidative phosphorylation needs membrane gradients, complexes, and ATP synthase pathway support."
  }),
  staged("combustion", "electrochem-energy", "Combustion", {
    blockedReason: "Combustion needs multi-molecule stoichiometry, oxygen radical chemistry, and heat-release modeling."
  }),
  staged("catalytic-cracking", "electrochem-energy", "Catalytic cracking", {
    blockedReason: "Catalytic cracking needs surface catalysis and hydrocarbon fragmentation rules."
  }),
  staged("hydroformylation", "electrochem-energy", "Hydroformylation", {
    blockedReason: "Hydroformylation needs organometallic CO/H2 insertion and catalytic cycle support."
  }),
  staged("catalytic-hydrogenation", "electrochem-energy", "Catalytic hydrogenation", {
    blockedReason: "Catalytic hydrogenation needs catalyst-surface adsorption and H-H activation rules."
  })
];

export const implementedReactionFamilies = reactionFamilies.filter((item) => item.status === "implemented");

function family(id: string, expansion: ReactionExpansionId, label: string, status: ReactionFamilyStatus, primitiveActions: ReactionActionType[], metadata: Partial<Omit<ReactionFamily, "id" | "expansion" | "label" | "status" | "primitiveActions" | "electronFirst">> = {}): ReactionFamily {
  return { id, expansion, label, status, primitiveActions, electronFirst: true, ...metadata };
}

function staged(id: string, expansion: ReactionExpansionId, label: string, metadata: Partial<Omit<ReactionFamily, "id" | "expansion" | "label" | "status" | "primitiveActions" | "electronFirst">> = {}): ReactionFamily {
  return family(id, expansion, label, "staged", ["form-bond", "break-bond"], metadata);
}
