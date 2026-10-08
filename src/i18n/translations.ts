import React, { createContext, useContext, useEffect, useState } from 'react';

export type LocaleCode = 'en' | 'fr' | 'de' | 'es' | 'ar';

export interface LocaleDescriptor {
  code: LocaleCode;
  label: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LOCALES: LocaleDescriptor[] = [
  { code: 'en', label: 'EN', nativeName: 'English', dir: 'ltr' },
  { code: 'fr', label: 'FR', nativeName: 'Français', dir: 'ltr' },
  { code: 'de', label: 'DE', nativeName: 'Deutsch', dir: 'ltr' },
  { code: 'es', label: 'ES', nativeName: 'Español', dir: 'ltr' },
  { code: 'ar', label: 'AR', nativeName: 'العربية', dir: 'rtl' },
];

export interface TranslationDictionary {
  appTitle: string;
  modes: {
    compare: string;
    merge: string;
    tests: string;
    tooling: string;
  };
  toolbar: {
    sampleFiles: string;
    swapSides: string;
    rerun: string;
    openFiles: string;
    viewReport: string;
    exportReport: string;
    themeDark: string;
    themeLight: string;
    language: string;
  };
  compareHome: {
    title: string;
    subtitle: string;
    dropPrompt: string;
    orText: string;
    selectFilesBtn: string;
    oldLabel: string;
    newLabel: string;
    changeFileBtn: string;
    filesReadyStatus: string;
    compareBtn: string;
    emptyPrompt: string;
    presetsTitle: string;
    presetStandard: string;
    presetIdentical: string;
    presetCorrupted: string;
  };
  mergeHome: {
    title: string;
    subtitle: string;
    baseLabel: string;
    oursLabel: string;
    theirsLabel: string;
    selectBtn: string;
    readyStatus: string;
    analyzeMergeBtn: string;
    presetsTitle: string;
    presetConflicts: string;
    presetClean: string;
  };
  progress: {
    analyzingCompare: string;
    analyzingMerge: string;
    stepReadOld: string;
    stepReadNew: string;
    stepExtractObjects: string;
    stepCompareStructure: string;
    stepAnalyzeSource: string;
    stepReadThreeWay: string;
    stepNormalizeHierarchy: string;
    stepEvaluateRules: string;
    stepDetectConflicts: string;
  };
  summary: {
    added: string;
    removed: string;
    modified: string;
    same: string;
    unchanged: string;
    conflict: string;
    resolved: string;
    propertyChanges: string;
    triggersModified: string;
    programUnitsModified: string;
  };
  filters: {
    searchPlaceholder: string;
    onlyChanges: string;
    showUnchanged: string;
    allTypes: string;
    blocks: string;
    items: string;
    triggers: string;
    programUnits: string;
    canvases: string;
    windows: string;
    lovs: string;
    recordGroups: string;
    resetFilters: string;
  };
  tree: {
    objectHierarchy: string;
    showAll: string;
    windows: string;
    canvases: string;
    blocks: string;
    triggers: string;
    programUnits: string;
    lovs: string;
    recordGroups: string;
    changesCount: string;
  };
  diffView: {
    noDifferencesTitle: string;
    noDifferencesDesc: string;
    inspectUnchangedBtn: string;
    noFilterMatchesTitle: string;
    noFilterMatchesDesc: string;
    objectsCount: string;
    objectSingle: string;
    linesAdded: string;
    linesRemoved: string;
    linesModified: string;
    inspectSplitDiff: string;
    hideSplitDiff: string;
    objectProperties: string;
    devNormalizedView: string;
    hideNormalizedView: string;
    colProperty: string;
    colOld: string;
    colNew: string;
    colState: string;
    splitViewBtn: string;
    unifiedViewBtn: string;
    sourceLabel: string;
  };
  mergeView: {
    analysisComplete: string;
    autoMergeCountMsg: string;
    conflictsRequireDecisionMsg: string;
    zeroConflictsReadyMsg: string;
    tabConflicts: string;
    tabAutoMerged: string;
    tabSummary: string;
    noConflictsTitle: string;
    noConflictsDesc: string;
    proceedToExportBtn: string;
    remainingCount: string;
    identicalAutoMergedNote: string;
    resolveRemainingOursBtn: string;
    conflictCounter: string;
    conflictExplanation: string;
    prevBtn: string;
    nextBtn: string;
    keepOursBtn: string;
    keepTheirsBtn: string;
    keepBaseBtn: string;
    customBtn: string;
    customValueLabel: string;
    cancelBtn: string;
    applyCustomBtn: string;
    conflictResolvedBanner: string;
    resultWillUse: string;
    nextConflictBtn: string;
    allResolvedReviewBtn: string;
    autoMergedTableTitle: string;
    autoMergedTableSub: string;
    colObject: string;
    colTarget: string;
    colRule: string;
    colMergedValue: string;
    mergeReadyTitle: string;
    mergeStatusTitle: string;
    readyForExportBadge: string;
    unresolvedConflictsBadge: string;
    statAutoMerged: string;
    statConflictsResolved: string;
    statRemainingConflicts: string;
    outputLabel: string;
    validateBtn: string;
    exportMergedFmbBtn: string;
    validationPassedBanner: string;
    validationBlockedBanner: string;
  };
  modals: {
    errorDefaultTitle: string;
    errorMissingToolingTitle: string;
    errorFileUnsupported: string;
    fileMayBe: string;
    reasonUnavailable: string;
    reasonLocked: string;
    reasonCorrupted: string;
    reasonIncompatible: string;
    technicalDetails: string;
    configureToolingBtn: string;
    tryAgainBtn: string;
    chooseAnotherFileBtn: string;
    toolingTitle: string;
    oracleHomeLabel: string;
    frmf2xmlLabel: string;
    frmxml2fLabel: string;
    frmcmpLabel: string;
    testMissingToolingLink: string;
    closeBtn: string;
    saveConfigBtn: string;
    savedNotice: string;
    testSuiteTitle: string;
    testSuiteSub: string;
    saveHtmlReportBtn: string;
  };
}

export const TRANSLATIONS: Record<LocaleCode, TranslationDictionary> = {
  en: {
    appTitle: 'FMB Diff & Merge',
    modes: {
      compare: 'Compare',
      merge: 'Merge',
      tests: 'Engine Tests',
      tooling: 'Tooling',
    },
    toolbar: {
      sampleFiles: 'Sample .fmb',
      swapSides: 'Swap Old / New',
      rerun: 'Re-run',
      openFiles: 'Select files',
      viewReport: 'Preview Report',
      exportReport: 'Export HTML',
      themeDark: 'Dark',
      themeLight: 'Light',
      language: 'Language',
    },
    compareHome: {
      title: 'Compare two FMB files',
      subtitle: 'Compare two FMB files and understand exactly what changed.',
      dropPrompt: 'Drop FMB files here',
      orText: 'or',
      selectFilesBtn: 'Select files',
      oldLabel: 'OLD',
      newLabel: 'NEW',
      changeFileBtn: 'Browse...',
      filesReadyStatus: 'Both FMB modules validated',
      compareBtn: 'Compare files',
      emptyPrompt: 'Select two FMB files to start a comparison.',
      presetsTitle: 'Load workspace sample:',
      presetStandard: 'customer_v1.fmb ↔ customer_v2.fmb',
      presetIdentical: 'Identical FMBs (No differences)',
      presetCorrupted: 'Locked / Corrupted FMB Error',
    },
    mergeHome: {
      title: '3-Way Merge FMB versions',
      subtitle: 'Merge changes from two versions using a safe 3-way merge with conflict detection and resolution.',
      baseLabel: 'BASE',
      oursLabel: 'OURS',
      theirsLabel: 'THEIRS',
      selectBtn: 'Browse...',
      readyStatus: 'Base, Ours, and Theirs ready for 3-way analysis',
      analyzeMergeBtn: 'Analyze merge',
      presetsTitle: 'Load merge sample:',
      presetConflicts: '3-Way Merge (37 Auto / 4 Conflicts)',
      presetClean: 'Conflict-Free Merge (0 Conflicts)',
    },
    progress: {
      analyzingCompare: 'Analyzing FMB files...',
      analyzingMerge: 'Analyzing 3-way merge...',
      stepReadOld: 'Reading old form',
      stepReadNew: 'Reading new form',
      stepExtractObjects: 'Extracting objects',
      stepCompareStructure: 'Comparing structure',
      stepAnalyzeSource: 'Analyzing source changes...',
      stepReadThreeWay: 'Reading Base, Ours, and Theirs forms',
      stepNormalizeHierarchy: 'Normalizing object hierarchies',
      stepEvaluateRules: 'Evaluating 3-way merge rules',
      stepDetectConflicts: 'Detecting property & PL/SQL conflicts',
    },
    summary: {
      added: 'Added',
      removed: 'Removed',
      modified: 'Modified',
      same: 'Same',
      unchanged: 'Unchanged',
      conflict: 'Conflict',
      resolved: 'Resolved',
      propertyChanges: 'property changes',
      triggersModified: 'triggers',
      programUnitsModified: 'program units',
    },
    filters: {
      searchPlaceholder: 'Search differences (Ctrl+F)...',
      onlyChanges: 'Only changes',
      showUnchanged: 'Show unchanged',
      allTypes: 'All Object Types',
      blocks: 'Blocks',
      items: 'Items',
      triggers: 'Triggers',
      programUnits: 'Program Units',
      canvases: 'Canvases',
      windows: 'Windows',
      lovs: 'LOVs',
      recordGroups: 'Record Groups',
      resetFilters: 'Reset filters',
    },
    tree: {
      objectHierarchy: 'OBJECT NAVIGATOR',
      showAll: 'Reset',
      windows: 'Windows',
      canvases: 'Canvases',
      blocks: 'Blocks',
      triggers: 'Triggers',
      programUnits: 'Program Units',
      lovs: 'LOVs',
      recordGroups: 'Record Groups',
      changesCount: 'changes',
    },
    diffView: {
      noDifferencesTitle: 'No differences',
      noDifferencesDesc: 'The two FMB files contain the same normalized structure.',
      inspectUnchangedBtn: 'Show unchanged objects',
      noFilterMatchesTitle: 'No matching differences',
      noFilterMatchesDesc: 'No objects match your current search or filter criteria.',
      objectsCount: 'objects',
      objectSingle: 'object',
      linesAdded: 'lines added',
      linesRemoved: 'lines removed',
      linesModified: 'lines modified',
      inspectSplitDiff: 'Expand split diff',
      hideSplitDiff: 'Collapse diff',
      objectProperties: 'Properties',
      devNormalizedView: 'Normalized AST (Debug)',
      hideNormalizedView: 'Hide AST',
      colProperty: 'Property',
      colOld: 'OLD',
      colNew: 'NEW',
      colState: 'State',
      splitViewBtn: 'Split',
      unifiedViewBtn: 'Unified',
      sourceLabel: 'Source',
    },
    mergeView: {
      analysisComplete: 'Merge analysis complete',
      autoMergeCountMsg: 'changes can be merged automatically',
      conflictsRequireDecisionMsg: 'conflicts require your decision',
      zeroConflictsReadyMsg: '0 remaining conflicts — ready to export',
      tabConflicts: 'Conflicts',
      tabAutoMerged: 'Auto-Merged',
      tabSummary: 'Summary & Export',
      noConflictsTitle: '✓ No conflicts',
      noConflictsDesc: 'All changes can be merged automatically.',
      proceedToExportBtn: 'Proceed to Merge Summary & Export →',
      remainingCount: 'remaining',
      identicalAutoMergedNote: 'identical changes in Ours & Theirs merged automatically.',
      resolveRemainingOursBtn: 'Resolve all remaining with Ours',
      conflictCounter: 'CONFLICT',
      conflictExplanation: 'Modified differently in Ours and Theirs relative to Base.',
      prevBtn: 'Prev',
      nextBtn: 'Next',
      keepOursBtn: 'Keep Ours',
      keepTheirsBtn: 'Keep Theirs',
      keepBaseBtn: 'Keep Base',
      customBtn: 'Custom',
      customValueLabel: 'Custom merged value:',
      cancelBtn: 'Cancel',
      applyCustomBtn: 'Apply Custom',
      conflictResolvedBanner: '✓ Conflict resolved',
      resultWillUse: 'Output will use',
      nextConflictBtn: 'Next conflict →',
      allResolvedReviewBtn: 'Review & Export →',
      autoMergedTableTitle: 'Automatically Merged Changes',
      autoMergedTableSub: 'Non-conflicting changes from Ours, Theirs, and identical updates.',
      colObject: 'Object',
      colTarget: 'Property / Target',
      colRule: 'Rule',
      colMergedValue: 'Merged Value',
      mergeReadyTitle: 'Merge ready',
      mergeStatusTitle: 'Merge status',
      readyForExportBadge: '✓ Ready',
      unresolvedConflictsBadge: '⚠ Unresolved conflicts',
      statAutoMerged: 'Automatically merged',
      statConflictsResolved: 'Conflicts resolved',
      statRemainingConflicts: 'Remaining conflicts',
      outputLabel: 'Output file (never overwrites originals):',
      validateBtn: 'Validate',
      exportMergedFmbBtn: 'Export merged FMB',
      validationPassedBanner: 'Structural & PL/SQL validation passed',
      validationBlockedBanner: 'Validation failed — resolve issues before exporting',
    },
    modals: {
      errorDefaultTitle: 'Unable to read the selected FMB file.',
      errorMissingToolingTitle: 'Oracle Forms tooling was not found.',
      errorFileUnsupported: 'This file is not supported. Please select an .fmb file.',
      fileMayBe: 'The file may be:',
      reasonUnavailable: 'unavailable',
      reasonLocked: 'locked by another application',
      reasonCorrupted: 'corrupted',
      reasonIncompatible: 'incompatible with the configured Oracle Forms tooling',
      technicalDetails: 'Technical details',
      configureToolingBtn: 'Configure',
      tryAgainBtn: 'Try again',
      chooseAnotherFileBtn: 'Choose another file',
      toolingTitle: 'Oracle Forms Tooling Paths',
      oracleHomeLabel: 'ORACLE_HOME Directory',
      frmf2xmlLabel: 'Forms2XML Utility (frmf2xml)',
      frmxml2fLabel: 'XML2Forms Utility (frmxml2f)',
      frmcmpLabel: 'Forms Compiler (frmcmp_batch)',
      testMissingToolingLink: 'Simulate missing Oracle tooling error',
      closeBtn: 'Close',
      saveConfigBtn: 'Save Configuration',
      savedNotice: 'Saved',
      testSuiteTitle: 'Diff & 3-Way Merge Engine Verification',
      testSuiteSub: 'Specification test cases verified',
      saveHtmlReportBtn: 'Save HTML Report',
    },
  },
  fr: {
    appTitle: 'FMB Diff & Merge',
    modes: {
      compare: 'Comparer',
      merge: 'Fusionner',
      tests: 'Tests Moteur',
      tooling: 'Outils Oracle',
    },
    toolbar: {
      sampleFiles: 'Exemples .fmb',
      swapSides: 'Inverser Ancien / Nouveau',
      rerun: 'Relancer',
      openFiles: 'Choisir fichiers',
      viewReport: 'Aperçu Rapport',
      exportReport: 'Exporter HTML',
      themeDark: 'Sombre',
      themeLight: 'Clair',
      language: 'Langue',
    },
    compareHome: {
      title: 'Comparer deux fichiers FMB',
      subtitle: 'Comparez deux fichiers FMB et comprenez exactement ce qui a changé.',
      dropPrompt: 'Déposez les fichiers FMB ici',
      orText: 'ou',
      selectFilesBtn: 'Sélectionner des fichiers',
      oldLabel: 'ANCIEN',
      newLabel: 'NOUVEAU',
      changeFileBtn: 'Parcourir...',
      filesReadyStatus: 'Modules FMB validés',
      compareBtn: 'Comparer les fichiers',
      emptyPrompt: 'Sélectionnez deux fichiers FMB pour démarrer une comparaison.',
      presetsTitle: 'Charger un jeu d’essai :',
      presetStandard: 'customer_v1.fmb ↔ customer_v2.fmb',
      presetIdentical: 'FMB identiques (Aucune différence)',
      presetCorrupted: 'Erreur FMB verrouillé / corrompu',
    },
    mergeHome: {
      title: 'Fusion 3-voies de versions FMB',
      subtitle: 'Fusionnez deux versions via une fusion 3-voies sécurisée avec détection et résolution des conflits.',
      baseLabel: 'BASE',
      oursLabel: 'NOTRE (OURS)',
      theirsLabel: 'LEUR (THEIRS)',
      selectBtn: 'Parcourir...',
      readyStatus: 'Base, Ours et Theirs prêts pour l’analyse',
      analyzeMergeBtn: 'Analyser la fusion',
      presetsTitle: 'Charger un scénario de fusion :',
      presetConflicts: 'Fusion 3-voies (37 Auto / 4 Conflits)',
      presetClean: 'Fusion sans conflit (0 Conflit)',
    },
    progress: {
      analyzingCompare: 'Analyse des fichiers FMB...',
      analyzingMerge: 'Analyse de la fusion 3-voies...',
      stepReadOld: 'Lecture de l’ancien formulaire',
      stepReadNew: 'Lecture du nouveau formulaire',
      stepExtractObjects: 'Extraction des objets',
      stepCompareStructure: 'Comparaison de la structure',
      stepAnalyzeSource: 'Analyse des changements PL/SQL...',
      stepReadThreeWay: 'Lecture des modules Base, Ours et Theirs',
      stepNormalizeHierarchy: 'Normalisation de la hiérarchie',
      stepEvaluateRules: 'Évaluation des règles 3-voies',
      stepDetectConflicts: 'Détection des conflits de propriétés et PL/SQL',
    },
    summary: {
      added: 'Ajoutés',
      removed: 'Supprimés',
      modified: 'Modifiés',
      same: 'Identiques',
      unchanged: 'Inchangé',
      conflict: 'Conflit',
      resolved: 'Résolu',
      propertyChanges: 'propriétés modifiées',
      triggersModified: 'déclencheurs',
      programUnitsModified: 'unités de programme',
    },
    filters: {
      searchPlaceholder: 'Rechercher des différences (Ctrl+F)...',
      onlyChanges: 'Changements seuls',
      showUnchanged: 'Afficher inchangés',
      allTypes: 'Tous les types d’objets',
      blocks: 'Blocs',
      items: 'Éléments (Items)',
      triggers: 'Déclencheurs (Triggers)',
      programUnits: 'Unités de programme',
      canvases: 'Canevas',
      windows: 'Fenêtres',
      lovs: 'LOVs',
      recordGroups: 'Groupes d’enregistrements',
      resetFilters: 'Réinitialiser filtres',
    },
    tree: {
      objectHierarchy: 'NAVIGATEUR D’OBJETS',
      showAll: 'Tout voir',
      windows: 'Fenêtres',
      canvases: 'Canevas',
      blocks: 'Blocs',
      triggers: 'Déclencheurs',
      programUnits: 'Unités de programme',
      lovs: 'LOVs',
      recordGroups: 'Groupes d’enreg.',
      changesCount: 'modifs',
    },
    diffView: {
      noDifferencesTitle: 'Aucune différence',
      noDifferencesDesc: 'Les deux fichiers FMB contiennent la même structure normalisée.',
      inspectUnchangedBtn: 'Afficher les objets inchangés',
      noFilterMatchesTitle: 'Aucun résultat pour ce filtre',
      noFilterMatchesDesc: 'Aucun objet ne correspond à votre recherche.',
      objectsCount: 'objets',
      objectSingle: 'objet',
      linesAdded: 'lignes ajoutées',
      linesRemoved: 'lignes supprimées',
      linesModified: 'lignes modifiées',
      inspectSplitDiff: 'Ouvrir diff côte-à-côte',
      hideSplitDiff: 'Fermer diff',
      objectProperties: 'Propriétés',
      devNormalizedView: 'Modèle normalisé (Debug)',
      hideNormalizedView: 'Masquer JSON',
      colProperty: 'Propriété',
      colOld: 'ANCIEN',
      colNew: 'NOUVEAU',
      colState: 'État',
      splitViewBtn: 'Côte-à-côte',
      unifiedViewBtn: 'Unifié',
      sourceLabel: 'Code source',
    },
    mergeView: {
      analysisComplete: 'Analyse de fusion terminée',
      autoMergeCountMsg: 'modifications peuvent être fusionnées automatiquement',
      conflictsRequireDecisionMsg: 'conflits nécessitent votre décision',
      zeroConflictsReadyMsg: '0 conflit restant — prêt à exporter',
      tabConflicts: 'Conflits',
      tabAutoMerged: 'Fusion Auto',
      tabSummary: 'Résumé & Export',
      noConflictsTitle: '✓ Aucun conflit',
      noConflictsDesc: 'Toutes les modifications peuvent être fusionnées automatiquement.',
      proceedToExportBtn: 'Passer au résumé et à l’export →',
      remainingCount: 'restants',
      identicalAutoMergedNote: 'modifications identiques (Ours & Theirs) fusionnées automatiquement.',
      resolveRemainingOursBtn: 'Tout résoudre avec Notre (Ours)',
      conflictCounter: 'CONFLIT',
      conflictExplanation: 'Modifié différemment dans Ours et Theirs par rapport à Base.',
      prevBtn: 'Préc.',
      nextBtn: 'Suiv.',
      keepOursBtn: 'Garder Notre (Ours)',
      keepTheirsBtn: 'Garder Leur (Theirs)',
      keepBaseBtn: 'Garder Base',
      customBtn: 'Personnalisé',
      customValueLabel: 'Valeur fusionnée personnalisée :',
      cancelBtn: 'Annuler',
      applyCustomBtn: 'Appliquer',
      conflictResolvedBanner: '✓ Conflit résolu',
      resultWillUse: 'Résultat retenu :',
      nextConflictBtn: 'Conflit suivant →',
      allResolvedReviewBtn: 'Vérifier & Exporter →',
      autoMergedTableTitle: 'Modifications fusionnées automatiquement',
      autoMergedTableSub: 'Changements sans conflit issus de Ours, Theirs et modifications identiques.',
      colObject: 'Objet',
      colTarget: 'Propriété / Cible',
      colRule: 'Règle',
      colMergedValue: 'Valeur fusionnée',
      mergeReadyTitle: 'Fusion prête',
      mergeStatusTitle: 'État de la fusion',
      readyForExportBadge: '✓ Prêt',
      unresolvedConflictsBadge: '⚠ Conflits non résolus',
      statAutoMerged: 'Fusionnés automatiquement',
      statConflictsResolved: 'Conflits résolus',
      statRemainingConflicts: 'Conflits restants',
      outputLabel: 'Fichier de sortie (n’écrase jamais les originaux) :',
      validateBtn: 'Valider',
      exportMergedFmbBtn: 'Exporter le FMB fusionné',
      validationPassedBanner: 'Validation structurelle et PL/SQL réussie',
      validationBlockedBanner: 'Validation bloquée — résolvez les problèmes avant export',
    },
    modals: {
      errorDefaultTitle: 'Impossible de lire le fichier FMB sélectionné.',
      errorMissingToolingTitle: 'Outils Oracle Forms introuvables.',
      errorFileUnsupported: 'Ce fichier n’est pas pris en charge. Veuillez sélectionner un fichier .fmb.',
      fileMayBe: 'Le fichier est peut-être :',
      reasonUnavailable: 'indisponible',
      reasonLocked: 'verrouillé par une autre application',
      reasonCorrupted: 'corrompu',
      reasonIncompatible: 'incompatible avec la configuration Oracle Forms',
      technicalDetails: 'Détails techniques',
      configureToolingBtn: 'Configurer',
      tryAgainBtn: 'Réessayer',
      chooseAnotherFileBtn: 'Choisir un autre fichier',
      toolingTitle: 'Configuration des outils Oracle Forms',
      oracleHomeLabel: 'Répertoire ORACLE_HOME',
      frmf2xmlLabel: 'Extracteur Forms2XML (frmf2xml)',
      frmxml2fLabel: 'Reconstructeur XML2Forms (frmxml2f)',
      frmcmpLabel: 'Compilateur batch (frmcmp_batch)',
      testMissingToolingLink: 'Simuler l’erreur d’outil Oracle manquant',
      closeBtn: 'Fermer',
      saveConfigBtn: 'Enregistrer',
      savedNotice: 'Enregistré',
      testSuiteTitle: 'Tests unitaires des moteurs Diff & Merge 3-voies',
      testSuiteSub: 'Cas de test vérifiés',
      saveHtmlReportBtn: 'Enregistrer le rapport HTML',
    },
  },
  de: {
    appTitle: 'FMB Diff & Merge',
    modes: {
      compare: 'Vergleichen',
      merge: 'Zusammenführen',
      tests: 'Engine-Tests',
      tooling: 'Oracle-Tools',
    },
    toolbar: {
      sampleFiles: 'Beispiel-.fmb',
      swapSides: 'Alt / Neu tauschen',
      rerun: 'Neu starten',
      openFiles: 'Dateien wählen',
      viewReport: 'Bericht-Vorschau',
      exportReport: 'HTML-Export',
      themeDark: 'Dunkel',
      themeLight: 'Hell',
      language: 'Sprache',
    },
    compareHome: {
      title: 'Zwei FMB-Dateien vergleichen',
      subtitle: 'Vergleichen Sie zwei FMB-Dateien und erkennen Sie sofort alle Änderungen.',
      dropPrompt: 'FMB-Dateien hier ablegen',
      orText: 'oder',
      selectFilesBtn: 'Dateien auswählen',
      oldLabel: 'ALT',
      newLabel: 'NEU',
      changeFileBtn: 'Durchsuchen...',
      filesReadyStatus: 'Beide FMB-Module geprüft',
      compareBtn: 'Dateien vergleichen',
      emptyPrompt: 'Wählen Sie zwei FMB-Dateien für den Vergleich aus.',
      presetsTitle: 'Testdaten laden:',
      presetStandard: 'customer_v1.fmb ↔ customer_v2.fmb',
      presetIdentical: 'Identische FMBs (Keine Unterschiede)',
      presetCorrupted: 'Gesperrte / Beschädigte FMB-Datei',
    },
    mergeHome: {
      title: '3-Wege-Merge für FMB-Versionen',
      subtitle: 'Änderungen aus zwei Versionen per sicherem 3-Wege-Merge mit Konflikterkennung zusammenführen.',
      baseLabel: 'BASIS',
      oursLabel: 'UNSERE (OURS)',
      theirsLabel: 'DEREN (THEIRS)',
      selectBtn: 'Durchsuchen...',
      readyStatus: 'Basis, Ours und Theirs bereit zur Analyse',
      analyzeMergeBtn: 'Merge analysieren',
      presetsTitle: 'Merge-Szenario laden:',
      presetConflicts: '3-Wege-Merge (37 Auto / 4 Konflikte)',
      presetClean: 'Konfliktfreier Merge (0 Konflikte)',
    },
    progress: {
      analyzingCompare: 'FMB-Dateien werden analysiert...',
      analyzingMerge: '3-Wege-Merge wird analysiert...',
      stepReadOld: 'Altes Formular wird gelesen',
      stepReadNew: 'Neues Formular wird gelesen',
      stepExtractObjects: 'Objekte werden extrahiert',
      stepCompareStructure: 'Struktur wird verglichen',
      stepAnalyzeSource: 'PL/SQL-Quellcode wird analysiert...',
      stepReadThreeWay: 'Basis-, Ours- und Theirs-Module werden gelesen',
      stepNormalizeHierarchy: 'Objekthierarchie wird normalisiert',
      stepEvaluateRules: '3-Wege-Regeln werden ausgewertet',
      stepDetectConflicts: 'Eigenschafts- & PL/SQL-Konflikte werden geprüft',
    },
    summary: {
      added: 'Hinzugefügt',
      removed: 'Entfernt',
      modified: 'Geändert',
      same: 'Gleich',
      unchanged: 'Unverändert',
      conflict: 'Konflikt',
      resolved: 'Gelöst',
      propertyChanges: 'Eigenschaftsänderungen',
      triggersModified: 'Trigger',
      programUnitsModified: 'Programmeinheiten',
    },
    filters: {
      searchPlaceholder: 'Unterschiede suchen (Strg+F)...',
      onlyChanges: 'Nur Änderungen',
      showUnchanged: 'Unveränderte zeigen',
      allTypes: 'Alle Objekttypen',
      blocks: 'Blöcke',
      items: 'Elemente (Items)',
      triggers: 'Trigger',
      programUnits: 'Programmeinheiten',
      canvases: 'Canvases',
      windows: 'Fenster',
      lovs: 'LOVs',
      recordGroups: 'Datensatzgruppen',
      resetFilters: 'Filter zurücksetzen',
    },
    tree: {
      objectHierarchy: 'OBJEKTNAVIGATOR',
      showAll: 'Alle',
      windows: 'Fenster',
      canvases: 'Canvases',
      blocks: 'Blöcke',
      triggers: 'Trigger',
      programUnits: 'Programmeinheiten',
      lovs: 'LOVs',
      recordGroups: 'Datensatzgruppen',
      changesCount: 'Änd.',
    },
    diffView: {
      noDifferencesTitle: 'Keine Unterschiede',
      noDifferencesDesc: 'Beide FMB-Dateien enthalten dieselbe normalisierte Struktur.',
      inspectUnchangedBtn: 'Unveränderte Objekte anzeigen',
      noFilterMatchesTitle: 'Keine Treffer für diesen Filter',
      noFilterMatchesDesc: 'Keine Unterschiede entsprechen Ihrer aktuellen Suche.',
      objectsCount: 'Objekte',
      objectSingle: 'Objekt',
      linesAdded: 'Zeilen hinzugefügt',
      linesRemoved: 'Zeilen entfernt',
      linesModified: 'Zeilen geändert',
      inspectSplitDiff: 'Split-Diff öffnen',
      hideSplitDiff: 'Diff schließen',
      objectProperties: 'Eigenschaften',
      devNormalizedView: 'Normalisiertes Modell (Debug)',
      hideNormalizedView: 'JSON ausblenden',
      colProperty: 'Eigenschaft',
      colOld: 'ALT',
      colNew: 'NEU',
      colState: 'Status',
      splitViewBtn: 'Geteilt',
      unifiedViewBtn: 'Komombiniert',
      sourceLabel: 'Quellcode',
    },
    mergeView: {
      analysisComplete: 'Merge-Analyse abgeschlossen',
      autoMergeCountMsg: 'Änderungen können automatisch zusammengeführt werden',
      conflictsRequireDecisionMsg: 'Konflikte erfordern Ihre Entscheidung',
      zeroConflictsReadyMsg: '0 verbleibende Konflikte — bereit zum Export',
      tabConflicts: 'Konflikte',
      tabAutoMerged: 'Auto-Merge',
      tabSummary: 'Übersicht & Export',
      noConflictsTitle: '✓ Keine Konflikte',
      noConflictsDesc: 'Alle Änderungen können automatisch zusammengeführt werden.',
      proceedToExportBtn: 'Weiter zu Übersicht & Export →',
      remainingCount: 'offen',
      identicalAutoMergedNote: 'identische Änderungen automatisch übernommen.',
      resolveRemainingOursBtn: 'Verbleibende mit Unsere (Ours) lösen',
      conflictCounter: 'KONFLIKT',
      conflictExplanation: 'In Ours und Theirs unterschiedlich gegenüber Basis geändert.',
      prevBtn: 'Zurück',
      nextBtn: 'Weiter',
      keepOursBtn: 'Unsere behalten (Ours)',
      keepTheirsBtn: 'Deren behalten (Theirs)',
      keepBaseBtn: 'Basis behalten',
      customBtn: 'Benutzerdefiniert',
      customValueLabel: 'Benutzerdefinierter Wert:',
      cancelBtn: 'Abbrechen',
      applyCustomBtn: 'Übernehmen',
      conflictResolvedBanner: '✓ Konflikt gelöst',
      resultWillUse: 'Ergebnis verwendet:',
      nextConflictBtn: 'Nächster Konflikt →',
      allResolvedReviewBtn: 'Prüfen & Exportieren →',
      autoMergedTableTitle: 'Automatisch zusammengeführte Änderungen',
      autoMergedTableSub: 'Konfliktfreie Änderungen aus Ours, Theirs und identischen Updates.',
      colObject: 'Objekt',
      colTarget: 'Eigenschaft / Ziel',
      colRule: 'Regel',
      colMergedValue: 'Zusammengeführter Wert',
      mergeReadyTitle: 'Merge bereit',
      mergeStatusTitle: 'Merge-Status',
      readyForExportBadge: '✓ Bereit',
      unresolvedConflictsBadge: '⚠ Offene Konflikte',
      statAutoMerged: 'Automatisch zusammengeführt',
      statConflictsResolved: 'Konflikte gelöst',
      statRemainingConflicts: 'Verbleibende Konflikte',
      outputLabel: 'Ausgabedatei (überschreibt niemals Originaldateien):',
      validateBtn: 'Validieren',
      exportMergedFmbBtn: 'Zusammengeführte FMB exportieren',
      validationPassedBanner: 'Struktur- und PL/SQL-Validierung erfolgreich',
      validationBlockedBanner: 'Validierung blockiert — bitte offene Punkte lösen',
    },
    modals: {
      errorDefaultTitle: 'Die ausgewählte FMB-Datei kann nicht gelesen werden.',
      errorMissingToolingTitle: 'Oracle Forms-Werkzeuge wurden nicht gefunden.',
      errorFileUnsupported: 'Diese Datei wird nicht unterstützt. Bitte wählen Sie eine .fmb-Datei.',
      fileMayBe: 'Mögliche Ursachen:',
      reasonUnavailable: 'nicht verfügbar',
      reasonLocked: 'von einer anderen Anwendung gesperrt',
      reasonCorrupted: 'beschädigt',
      reasonIncompatible: 'inkompatibel mit den konfigurierten Oracle Forms-Tools',
      technicalDetails: 'Technische Details',
      configureToolingBtn: 'Konfigurieren',
      tryAgainBtn: 'Erneut versuchen',
      chooseAnotherFileBtn: 'Andere Datei wählen',
      toolingTitle: 'Oracle Forms-Werkzeugkonfiguration',
      oracleHomeLabel: 'ORACLE_HOME-Verzeichnis',
      frmf2xmlLabel: 'Forms2XML-Konverter (frmf2xml)',
      frmxml2fLabel: 'XML2Forms-Konverter (frmxml2f)',
      frmcmpLabel: 'Batch-Compiler (frmcmp_batch)',
      testMissingToolingLink: 'Fehlende Oracle-Tools simulieren',
      closeBtn: 'Schließen',
      saveConfigBtn: 'Speichern',
      savedNotice: 'Gespeichert',
      testSuiteTitle: 'Diff- & 3-Wege-Merge-Engine Selbsttest',
      testSuiteSub: 'Spezifikationstests bestanden',
      saveHtmlReportBtn: 'HTML-Bericht speichern',
    },
  },
  es: {
    appTitle: 'FMB Diff & Merge',
    modes: {
      compare: 'Comparar',
      merge: 'Fusionar',
      tests: 'Pruebas Motor',
      tooling: 'Herramientas',
    },
    toolbar: {
      sampleFiles: 'Ejemplos .fmb',
      swapSides: 'Invertir Antiguo / Nuevo',
      rerun: 'Reejecutar',
      openFiles: 'Abrir archivos',
      viewReport: 'Vista previa',
      exportReport: 'Exportar HTML',
      themeDark: 'Oscuro',
      themeLight: 'Claro',
      language: 'Idioma',
    },
    compareHome: {
      title: 'Comparar dos archivos FMB',
      subtitle: 'Compare dos archivos FMB y comprenda exactamente qué cambió.',
      dropPrompt: 'Suelte los archivos FMB aquí',
      orText: 'o',
      selectFilesBtn: 'Seleccionar archivos',
      oldLabel: 'ANTIGUO',
      newLabel: 'NUEVO',
      changeFileBtn: 'Examinar...',
      filesReadyStatus: 'Ambos módulos FMB validados',
      compareBtn: 'Comparar archivos',
      emptyPrompt: 'Seleccione dos archivos FMB para iniciar una comparación.',
      presetsTitle: 'Cargar ejemplo rápido:',
      presetStandard: 'customer_v1.fmb ↔ customer_v2.fmb',
      presetIdentical: 'FMB idénticos (Sin diferencias)',
      presetCorrupted: 'Error de FMB bloqueado / corrupto',
    },
    mergeHome: {
      title: 'Fusión de 3 vías para FMB',
      subtitle: 'Combine cambios de dos versiones mediante una fusión segura de 3 vías con detección de conflictos.',
      baseLabel: 'BASE',
      oursLabel: 'NUESTRO (OURS)',
      theirsLabel: 'SUYO (THEIRS)',
      selectBtn: 'Examinar...',
      readyStatus: 'Base, Ours y Theirs listos para analizar',
      analyzeMergeBtn: 'Analizar fusión',
      presetsTitle: 'Cargar escenario de fusión:',
      presetConflicts: 'Fusión 3-vías (37 Auto / 4 Conflictos)',
      presetClean: 'Fusión sin conflictos (0 Conflictos)',
    },
    progress: {
      analyzingCompare: 'Analizando archivos FMB...',
      analyzingMerge: 'Analizando fusión de 3 vías...',
      stepReadOld: 'Leyendo formulario antiguo',
      stepReadNew: 'Leyendo formulario nuevo',
      stepExtractObjects: 'Extrayendo objetos',
      stepCompareStructure: 'Comparando estructura',
      stepAnalyzeSource: 'Analizando cambios de código PL/SQL...',
      stepReadThreeWay: 'Leyendo formularios Base, Ours y Theirs',
      stepNormalizeHierarchy: 'Normalizando jerarquía de objetos',
      stepEvaluateRules: 'Evaluando reglas de fusión 3-vías',
      stepDetectConflicts: 'Detectando conflictos de propiedades y PL/SQL',
    },
    summary: {
      added: 'Añadidos',
      removed: 'Eliminados',
      modified: 'Modificados',
      same: 'Iguales',
      unchanged: 'Sin cambios',
      conflict: 'Conflicto',
      resolved: 'Resuelto',
      propertyChanges: 'cambios de propiedad',
      triggersModified: 'disparadores',
      programUnitsModified: 'unidades de programa',
    },
    filters: {
      searchPlaceholder: 'Buscar diferencias (Ctrl+F)...',
      onlyChanges: 'Solo cambios',
      showUnchanged: 'Mostrar iguales',
      allTypes: 'Todos los objetos',
      blocks: 'Bloques',
      items: 'Ítems',
      triggers: 'Disparadores (Triggers)',
      programUnits: 'Unidades de programa',
      canvases: 'Lienzos (Canvases)',
      windows: 'Ventanas',
      lovs: 'LOVs',
      recordGroups: 'Grupos de registros',
      resetFilters: 'Restablecer filtros',
    },
    tree: {
      objectHierarchy: 'NAVEGADOR DE OBJETOS',
      showAll: 'Todos',
      windows: 'Ventanas',
      canvases: 'Lienzos',
      blocks: 'Bloques',
      triggers: 'Disparadores',
      programUnits: 'Unidades prog.',
      lovs: 'LOVs',
      recordGroups: 'Grupos reg.',
      changesCount: 'cambios',
    },
    diffView: {
      noDifferencesTitle: 'Sin diferencias',
      noDifferencesDesc: 'Los dos archivos FMB contienen la misma estructura normalizada.',
      inspectUnchangedBtn: 'Mostrar objetos sin cambios',
      noFilterMatchesTitle: 'Sin coincidencias para este filtro',
      noFilterMatchesDesc: 'Ningún objeto coincide con su búsqueda o filtro actual.',
      objectsCount: 'objetos',
      objectSingle: 'objeto',
      linesAdded: 'líneas añadidas',
      linesRemoved: 'líneas eliminadas',
      linesModified: 'líneas modificadas',
      inspectSplitDiff: 'Ver diff dividido',
      hideSplitDiff: 'Ocultar diff',
      objectProperties: 'Propiedades',
      devNormalizedView: 'Modelo normalizado (Debug)',
      hideNormalizedView: 'Ocultar JSON',
      colProperty: 'Propiedad',
      colOld: 'ANTIGUO',
      colNew: 'NUEVO',
      colState: 'Estado',
      splitViewBtn: 'Dividido',
      unifiedViewBtn: 'Unificado',
      sourceLabel: 'Código fuente',
    },
    mergeView: {
      analysisComplete: 'Análisis de fusión completado',
      autoMergeCountMsg: 'cambios se pueden fusionar automáticamente',
      conflictsRequireDecisionMsg: 'conflictos requieren su decisión',
      zeroConflictsReadyMsg: '0 conflictos pendientes — listo para exportar',
      tabConflicts: 'Conflictos',
      tabAutoMerged: 'Auto-Fusionados',
      tabSummary: 'Resumen y Exportar',
      noConflictsTitle: '✓ Sin conflictos',
      noConflictsDesc: 'Todos los cambios se pueden fusionar automáticamente.',
      proceedToExportBtn: 'Ir al Resumen y Exportación →',
      remainingCount: 'pendientes',
      identicalAutoMergedNote: 'cambios idénticos fusionados automáticamente.',
      resolveRemainingOursBtn: 'Resolver pendientes con Nuestro (Ours)',
      conflictCounter: 'CONFLICTO',
      conflictExplanation: 'Modificado de forma distinta en Ours y Theirs respecto a Base.',
      prevBtn: 'Ant.',
      nextBtn: 'Sig.',
      keepOursBtn: 'Mantener Nuestro (Ours)',
      keepTheirsBtn: 'Mantener Suyo (Theirs)',
      keepBaseBtn: 'Mantener Base',
      customBtn: 'Personalizado',
      customValueLabel: 'Valor fusionado personalizado:',
      cancelBtn: 'Cancelar',
      applyCustomBtn: 'Aplicar',
      conflictResolvedBanner: '✓ Conflicto resuelto',
      resultWillUse: 'Resultado usará:',
      nextConflictBtn: 'Siguiente conflicto →',
      allResolvedReviewBtn: 'Revisar y Exportar →',
      autoMergedTableTitle: 'Cambios fusionados automáticamente',
      autoMergedTableSub: 'Cambios sin conflicto de Ours, Theirs y actualizaciones idénticas.',
      colObject: 'Objeto',
      colTarget: 'Propiedad / Destino',
      colRule: 'Regla',
      colMergedValue: 'Valor fusionado',
      mergeReadyTitle: 'Fusión lista',
      mergeStatusTitle: 'Estado de la fusión',
      readyForExportBadge: '✓ Listo',
      unresolvedConflictsBadge: '⚠ Conflictos pendientes',
      statAutoMerged: 'Fusionados automáticamente',
      statConflictsResolved: 'Conflictos resueltos',
      statRemainingConflicts: 'Conflictos pendientes',
      outputLabel: 'Archivo de salida (nunca sobrescribe los originales):',
      validateBtn: 'Validar',
      exportMergedFmbBtn: 'Exportar FMB fusionado',
      validationPassedBanner: 'Validación estructural y PL/SQL superada',
      validationBlockedBanner: 'Validación bloqueada — resuelva los conflictos pendientes',
    },
    modals: {
      errorDefaultTitle: 'No se puede leer el archivo FMB seleccionado.',
      errorMissingToolingTitle: 'No se encontraron las herramientas de Oracle Forms.',
      errorFileUnsupported: 'Este archivo no es compatible. Seleccione un archivo .fmb.',
      fileMayBe: 'El archivo puede estar:',
      reasonUnavailable: 'no disponible',
      reasonLocked: 'bloqueado por otra aplicación',
      reasonCorrupted: 'dañado o corrupto',
      reasonIncompatible: 'incompatible con las herramientas de Oracle Forms configuradas',
      technicalDetails: 'Detalles técnicos',
      configureToolingBtn: 'Configurar',
      tryAgainBtn: 'Reintentar',
      chooseAnotherFileBtn: 'Elegir otro archivo',
      toolingTitle: 'Configuración de herramientas Oracle Forms',
      oracleHomeLabel: 'Directorio ORACLE_HOME',
      frmf2xmlLabel: 'Extractor Forms2XML (frmf2xml)',
      frmxml2fLabel: 'Reconstructor XML2Forms (frmxml2f)',
      frmcmpLabel: 'Compilador por lotes (frmcmp_batch)',
      testMissingToolingLink: 'Simular error de herramienta Oracle faltante',
      closeBtn: 'Cerrar',
      saveConfigBtn: 'Guardar',
      savedNotice: 'Guardado',
      testSuiteTitle: 'Verificación de motores Diff y Fusión 3-vías',
      testSuiteSub: 'Casos de prueba verificados',
      saveHtmlReportBtn: 'Guardar informe HTML',
    },
  },
  ar: {
    appTitle: 'FMB Diff & Merge',
    modes: {
      compare: 'مقارنة',
      merge: 'دمج ثلاثي',
      tests: 'اختبارات المحرك',
      tooling: 'أدوات أوراكل',
    },
    toolbar: {
      sampleFiles: 'ملفات .fmb تجريبية',
      swapSides: 'تبديل القديم / الجديد',
      rerun: 'إعادة الفحص',
      openFiles: 'اختيار ملفات',
      viewReport: 'معاينة التقرير',
      exportReport: 'تصدير HTML',
      themeDark: 'داكن',
      themeLight: 'فاتح',
      language: 'اللغة',
    },
    compareHome: {
      title: 'مقارنة ملفي Oracle Forms FMB',
      subtitle: 'قارن بين ملفي FMB وتعرّف بدقة على جميع التغييرات في الكتل والعناصر وشفرات PL/SQL.',
      dropPrompt: 'أفلت ملفات FMB هنا',
      orText: 'أو',
      selectFilesBtn: 'اختر الملفات',
      oldLabel: 'القديم (OLD)',
      newLabel: 'الجديد (NEW)',
      changeFileBtn: 'استعراض...',
      filesReadyStatus: 'تم التحقق من صلاحية ملفي FMB',
      compareBtn: 'مقارنة الملفات',
      emptyPrompt: 'اختر ملفي FMB لبدء المقارنة.',
      presetsTitle: 'تحميل سيناريو جاهز:',
      presetStandard: 'customer_v1.fmb ↔ customer_v2.fmb',
      presetIdentical: 'ملفان متطابقان (لا توجد فروق)',
      presetCorrupted: 'محاكاة ملف مقفل أو تالف',
    },
    mergeHome: {
      title: 'دمج ثلاثي آمن لملفات FMB',
      subtitle: 'ادمج التغييرات من نسختين باستخدام الدمج الثلاثي الآمن مع اكتشاف التعارضات وحلها.',
      baseLabel: 'الأصل (BASE)',
      oursLabel: 'نسختنا (OURS)',
      theirsLabel: 'نسختهم (THEIRS)',
      selectBtn: 'استعراض...',
      readyStatus: 'ملفات الأصل ونسختنا ونسختهم جاهزة للتحليل',
      analyzeMergeBtn: 'تحليل الدمج',
      presetsTitle: 'تحميل سيناريو دمج:',
      presetConflicts: 'دمج ثلاثي (37 تلقائي / 4 تعارضات)',
      presetClean: 'دمج بدون تعارضات (0 تعارض)',
    },
    progress: {
      analyzingCompare: 'جاري تحليل ملفات FMB...',
      analyzingMerge: 'جاري تحليل الدمج الثلاثي...',
      stepReadOld: 'قراءة النموذج القديم',
      stepReadNew: 'قراءة النموذج الجديد',
      stepExtractObjects: 'استخراج الكائنات والعناصر',
      stepCompareStructure: 'مقارنة الهيكلة والخصائص',
      stepAnalyzeSource: 'تحليل تغييرات شفرة PL/SQL...',
      stepReadThreeWay: 'قراءة نماذج Base و Ours و Theirs',
      stepNormalizeHierarchy: 'توحيد الهيكلة القياسية',
      stepEvaluateRules: 'تطبيق قواعد الدمج الثلاثي',
      stepDetectConflicts: 'فحص تعارضات الخصائص و PL/SQL',
    },
    summary: {
      added: 'مضاف',
      removed: 'محذوف',
      modified: 'معدّل',
      same: 'متطابق',
      unchanged: 'بدون تغيير',
      conflict: 'تعارض',
      resolved: 'تم الحل',
      propertyChanges: 'تغييرات خصائص',
      triggersModified: 'مشغلات (Triggers)',
      programUnitsModified: 'وحدات برمجية',
    },
    filters: {
      searchPlaceholder: 'ابحث في الفروق (Ctrl+F)...',
      onlyChanges: 'التغييرات فقط',
      showUnchanged: 'إظهار غير المعدّل',
      allTypes: 'جميع أنواع الكائنات',
      blocks: 'الكتل (Blocks)',
      items: 'العناصر (Items)',
      triggers: 'المشغلات (Triggers)',
      programUnits: 'الوحدات البرمجية',
      canvases: 'اللوحات (Canvases)',
      windows: 'النوافذ (Windows)',
      lovs: 'قوائم القيم (LOVs)',
      recordGroups: 'مجموعات السجلات',
      resetFilters: 'إعادة ضبط الفلاتر',
    },
    tree: {
      objectHierarchy: 'مستكشف الكائنات',
      showAll: 'الكل',
      windows: 'النوافذ',
      canvases: 'اللوحات',
      blocks: 'الكتل',
      triggers: 'المشغلات',
      programUnits: 'الوحدات البرمجية',
      lovs: 'قوائم LOV',
      recordGroups: 'مجموعات السجلات',
      changesCount: 'تغيير',
    },
    diffView: {
      noDifferencesTitle: 'لا توجد فروق',
      noDifferencesDesc: 'يحتوي ملفا FMB على نفس البنية الموحّدة تماماً.',
      inspectUnchangedBtn: 'إظهار الكائنات غير المعدّلة',
      noFilterMatchesTitle: 'لا توجد نتائج مطابقة للفلتر',
      noFilterMatchesDesc: 'لا توجد فروق تطابق عبارة البحث أو الفلتر المحدد.',
      objectsCount: 'كائنات',
      objectSingle: 'كائن',
      linesAdded: 'أسطر مضافة',
      linesRemoved: 'أسطر محذوفة',
      linesModified: 'أسطر معدّلة',
      inspectSplitDiff: 'عرض المقارنة الجانبية',
      hideSplitDiff: 'إخفاء المقارنة',
      objectProperties: 'الخصائص',
      devNormalizedView: 'عرض النموذج الموحّد (للمطور)',
      hideNormalizedView: 'إخفاء JSON',
      colProperty: 'الخاصية',
      colOld: 'القديم (OLD)',
      colNew: 'الجديد (NEW)',
      colState: 'الحالة',
      splitViewBtn: 'جانبي',
      unifiedViewBtn: 'موحّد',
      sourceLabel: 'الشفرة المصدرية',
    },
    mergeView: {
      analysisComplete: 'اكتمل تحليل الدمج الثلاثي',
      autoMergeCountMsg: 'تغييرات يمكن دمجها تلقائياً',
      conflictsRequireDecisionMsg: 'تعارضات تتطلب قرارك',
      zeroConflictsReadyMsg: '0 تعارض متبقٍ — جاهز للتصدير',
      tabConflicts: 'التعارضات',
      tabAutoMerged: 'الدمج التلقائي',
      tabSummary: 'الملخص والتصدير',
      noConflictsTitle: '✓ لا توجد تعارضات',
      noConflictsDesc: 'يمكن دمج جميع التغييرات تلقائياً بأمان.',
      proceedToExportBtn: 'الانتقال إلى الملخص والتصدير ←',
      remainingCount: 'متبقٍ',
      identicalAutoMergedNote: 'تغييرات متطابقة تم دمجها تلقائياً.',
      resolveRemainingOursBtn: 'حل المتبقي باعتماد نسختنا (Ours)',
      conflictCounter: 'تعارض',
      conflictExplanation: 'تم تعديله بشكل مختلف في نسختنا ونسختهم مقارنة بالأصل.',
      prevBtn: 'السابق',
      nextBtn: 'التالي',
      keepOursBtn: 'اعتماد نسختنا (Ours)',
      keepTheirsBtn: 'اعتماد نسختهم (Theirs)',
      keepBaseBtn: 'اعتماد الأصل (Base)',
      customBtn: 'قيمة مخصصة',
      customValueLabel: 'أدخل القيمة المدمجة المخصصة:',
      cancelBtn: 'إلغاء',
      applyCustomBtn: 'تطبيق',
      conflictResolvedBanner: '✓ تم حل التعارض',
      resultWillUse: 'سيتم استخدام:',
      nextConflictBtn: 'التعارض التالي ←',
      allResolvedReviewBtn: 'مراجعة وتصدير ←',
      autoMergedTableTitle: 'التغييرات المدمجة تلقائياً',
      autoMergedTableSub: 'تغييرات غير متعارضة من Ours و Theirs والتحديثات المتطابقة.',
      colObject: 'الكائن',
      colTarget: 'الخاصية / الهدف',
      colRule: 'القاعدة',
      colMergedValue: 'القيمة المدمجة',
      mergeReadyTitle: 'الدمج جاهز',
      mergeStatusTitle: 'حالة الدمج',
      readyForExportBadge: '✓ جاهز للتصدير',
      unresolvedConflictsBadge: '⚠ تعارضات غير محلولة',
      statAutoMerged: 'تم دمجها تلقائياً',
      statConflictsResolved: 'تعارضات تم حلها',
      statRemainingConflicts: 'تعارضات متبقية',
      outputLabel: 'ملف الإخراج (لا يستبدل الملفات الأصلية أبداً):',
      validateBtn: 'تحقق من السلامة',
      exportMergedFmbBtn: 'تصدير ملف FMB المدمج',
      validationPassedBanner: 'نجح التحقق الهيكلي وفحص توازن كتل PL/SQL',
      validationBlockedBanner: 'التحقق متوقف — يرجى حل التعارضات المتبقية قبل التصدير',
    },
    modals: {
      errorDefaultTitle: 'تعذّر قراءة ملف FMB المحدد.',
      errorMissingToolingTitle: 'لم يتم العثور على أدوات Oracle Forms.',
      errorFileUnsupported: 'هذا الملف غير مدعوم. يرجى اختيار ملف بامتداد .fmb.',
      fileMayBe: 'قد يكون الملف:',
      reasonUnavailable: 'غير متوفر أو تم نقله',
      reasonLocked: 'مقفلاً بواسطة برنامج آخر (مثل Forms Builder)',
      reasonCorrupted: 'تالفاً أو غير مكتمل',
      reasonIncompatible: 'غير متوافق مع إصدار أدوات Oracle Forms',
      technicalDetails: 'التفاصيل التقنية',
      configureToolingBtn: 'إعداد المسارات',
      tryAgainBtn: 'إعادة المحاولة',
      chooseAnotherFileBtn: 'اختيار ملف آخر',
      toolingTitle: 'إعداد مسارات أدوات Oracle Forms',
      oracleHomeLabel: 'مجلد ORACLE_HOME',
      frmf2xmlLabel: 'أداة استخراج XML (frmf2xml)',
      frmxml2fLabel: 'أداة إعادة بناء FMB (frmxml2f)',
      frmcmpLabel: 'مترجم الدفعات (frmcmp_batch)',
      testMissingToolingLink: 'اختبار نافذة خطأ عدم وجود أدوات أوراكل',
      closeBtn: 'إغلاق',
      saveConfigBtn: 'حفظ الإعدادات',
      savedNotice: 'تم الحفظ',
      testSuiteTitle: 'اختبارات التحقق الآلي لمحرك المقارنة والدمج الثلاثي',
      testSuiteSub: 'حالات اختبار قياسية ناجحة',
      saveHtmlReportBtn: 'حفظ تقرير HTML',
    },
  },
};

interface I18nContextValue {
  locale: LocaleCode;
  setLocale: (code: LocaleCode) => void;
  t: TranslationDictionary;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: TRANSLATIONS.en,
  dir: 'ltr',
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<LocaleCode>(() => {
    const saved = localStorage.getItem('fmb_locale') as LocaleCode | null;
    if (saved && TRANSLATIONS[saved]) return saved;
    return 'en';
  });

  const setLocale = (code: LocaleCode) => {
    setLocaleState(code);
    localStorage.setItem('fmb_locale', code);
  };

  const descriptor =
    SUPPORTED_LOCALES.find((l) => l.code === locale) || SUPPORTED_LOCALES[0];

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = descriptor.dir;
  }, [locale, descriptor.dir]);

  return React.createElement(
    I18nContext.Provider,
    {
      value: {
        locale,
        setLocale,
        t: TRANSLATIONS[locale],
        dir: descriptor.dir,
      },
    },
    children
  );
};

export function useI18n() {
  return useContext(I18nContext);
}
