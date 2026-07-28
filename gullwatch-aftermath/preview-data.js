window.GULLWATCH_AFTERMATH_PREVIEW = {
  defaultEnding: "public-reckoning",
  endings: {
    "true-light": {
      label: "True Light",
      opening: "Custody at dawn",
      summary: "The grain ship cleared the reef, the true code returned, and Orren remained in an operating beacon under the party's witness.",
      pressure: "At dawn, three harbor seals appear on Gullwatch's door. Mara has orders to surrender the codebook, Nera watches from the wreck channel, and Orren refuses to light for anyone who will not name the stolen relief cargo.",
      leverage: "The working beacon can signal the ledger courier, but using it tells the Compact where the party is going.",
      stake: "Who receives lawful custody of a functioning public warning light?",
      clocks: {
        sealedRecords: 1,
        reliefUnrest: 2,
        memoryFracture: 0,
        blackChannel: 0
      }
    },
    "carried-memory": {
      label: "Carried Memory",
      opening: "The voice in the key",
      summary: "The grain ship survived, Orren left the tower inside the signal key, and Gullwatch became a dark, contested salvage site.",
      pressure: "The signal key speaks in Orren's voice before sunrise: someone below Gullwatch is answering his final code. Mara needs the key hidden, Nera needs its route, and salvage crews are already stripping the tower.",
      leverage: "Orren can identify the real ledger seal, but doing so advances Memory Fracture.",
      stake: "Whether Orren becomes a free witness, a public instrument, or a fading private memory.",
      clocks: {
        sealedRecords: 2,
        reliefUnrest: 1,
        memoryFracture: 2,
        blackChannel: 2
      }
    },
    "public-reckoning": {
      label: "Public Reckoning",
      opening: "The stopped harbor",
      summary: "The grain ship survived, the stolen relief manifest was broadcast, the harbor strike began, and Orren remained in the beacon as a witness.",
      pressure: "The harbor wakes to stopped cranes and copied manifests nailed to every post. The Compact calls the copies forged. Nera's flood district demands the cargo. Mara has until noon to deliver the unaltered ledger or lose her badge.",
      leverage: "The strike can surround the ledger house or clear a covert path, but it will not remain peaceful after Relief Unrest reaches 6.",
      stake: "Whether public truth produces restitution, a new monopoly, or a lasting civic compact.",
      clocks: {
        sealedRecords: 3,
        reliefUnrest: 4,
        memoryFracture: 1,
        blackChannel: 1
      }
    },
    "broken-beacon": {
      label: "Broken Beacon",
      opening: "A second wreck",
      summary: "The party saved survivors directly, Gullwatch was destroyed, navigation became dangerous, and Orren's final memory was scattered through the wreckage.",
      pressure: "A second ship grounds in clear weather. Salvagers bring Mara a brass shutter engraved with Orren's voice pattern, while lights answer from caves below the ruined tower. The harbor needs a route before nightfall.",
      leverage: "The emergency pilots can force access to the ledger house, but abandoning the harbor advances Black Channel twice.",
      stake: "What replaces Gullwatch, who controls it, and whose losses define the new route.",
      clocks: {
        sealedRecords: 2,
        reliefUnrest: 2,
        memoryFracture: 3,
        blackChannel: 4
      }
    }
  }
};
