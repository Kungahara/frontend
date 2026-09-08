"use client";

import { useLocale } from "next-intl";
import { useCallback, useEffect } from "react";

const french: Record<string, string> = {
  "Stock products": "Produits en stock", "Search stock products": "Rechercher dans le stock",
  "Search…": "Rechercher…", "Add product": "Ajouter un produit", "Add your first product": "Ajoutez votre premier produit",
  "Start adding products now": "Commencez à ajouter des produits", "Build your stock list and keep every item organized in one place.": "Créez votre liste de stock et gardez chaque article bien organisé.",
  "No products match your search.": "Aucun produit ne correspond à votre recherche.",
  "Name": "Nom", "Category": "Catégorie", "Size": "Taille", "Price bought for": "Prix d’achat",
  "Quantity": "Quantité", "Actions": "Actions", "Action": "Action", "Product name": "Nom du produit",
  "Quantity to add": "Quantité à ajouter", "Current stock": "Stock actuel", "Low-stock alert (20%)": "Alerte de stock faible (20 %)",
  "Calculated automatically as 20% of the entered quantity": "Calculé automatiquement à 20 % de la quantité saisie",
  "Choose category": "Choisir une catégorie", "Product category": "Catégorie du produit",
  "Create new category": "Créer une catégorie", "Enter category name": "Saisir le nom de la catégorie",
  "Add & continue": "Ajouter et continuer", "Edit product": "Modifier le produit", "Save changes": "Enregistrer les modifications",
  "Delete product": "Supprimer le produit", "Cancel": "Annuler", "Close": "Fermer",
  "Income and expenses": "Revenus et dépenses", "Recorded sales in RWF": "Ventes enregistrées en RWF",
  "Back to Stock products": "Retour aux produits en stock", "Income": "Revenus", "Expenses": "Dépenses",
  "Year": "Année", "Month": "Mois", "Graph period": "Période du graphique",
  "Products": "Produits", "Choose what to show on the graph.": "Choisissez les données à afficher sur le graphique.",
  "Items sold over time": "Articles vendus au fil du temps", "All items": "Tous les articles",
  "Categories": "Catégories", "Choose a category to analyze.": "Choisissez une catégorie à analyser.",
  "All categories": "Toutes les catégories", "No recorded sales for this selection and period.": "Aucune vente enregistrée pour cette sélection et cette période.",
  "No products in this category yet.": "Aucun produit dans cette catégorie pour le moment.",
  "Stock value": "Valeur du stock", "than last month": "par rapport au mois dernier",
  "Least item in stock": "Article le moins disponible", "Remaining stock:": "Stock restant :",
  "Sold stock value": "Valeur du stock vendu", "than yesterday": "par rapport à hier",
  "Most selling item": "Article le plus vendu", "Least selling item": "Article le moins vendu",
  "Money made today": "Revenus réalisés aujourd’hui", "sold": "vendus", "Sold items quantity": "Quantité d’articles vendus",
  "Items sold today": "Articles vendus aujourd’hui", "Losses suffered": "Pertes subies",
  "Money lost this month": "Argent perdu ce mois-ci", "Stock status": "État du stock", "Stock size:": "Taille du stock :",
  "Sales views": "Vues des ventes", "Today": "Aujourd’hui", "Historical sales": "Historique des ventes",
  "Sales analytics": "Analyse des ventes", "Today sales": "Ventes du jour", "Search today sales": "Rechercher dans les ventes du jour",
  "Money made in selected period": "Revenus de la période sélectionnée", "Money made": "Revenus réalisés",
  "Highest sales period": "Période de ventes la plus élevée", "Highest sales": "Ventes les plus élevées",
  "Items sold": "Articles vendus", "Sales recorded": "Ventes enregistrées",
  "In the selected": "Pendant la période sélectionnée", "Units sold in this": "Unités vendues pendant cette période",
  "Transactions in this": "Transactions pendant cette période", "Day": "Jour", "Week": "Semaine",
  "day": "jour", "week": "semaine", "month": "mois", "year": "année", "hour": "heure",
  "Search sales": "Rechercher dans les ventes", "Sales period": "Période des ventes", "Date": "Date",
  "Sell new item": "Vendre un nouvel article", "Sold for": "Prix de vente",
  "No sales match your search.": "Aucune vente ne correspond à votre recherche.",
  "Ready for today's first sale": "Prêt pour la première vente du jour",
  "Use Sell new item to record a sale. It will appear here automatically.": "Utilisez « Vendre un nouvel article » pour enregistrer une vente. Elle apparaîtra ici automatiquement.",
  "Edit sale": "Modifier la vente", "Delete sale": "Supprimer la vente", "Select product": "Sélectionner un produit",
  "Unit price": "Prix unitaire", "Available stock": "Stock disponible", "Record sale": "Enregistrer la vente",
  "This month": "Ce mois-ci", "This year": "Cette année", "All": "Tout",
  "Loans": "Prêts", "Money borrowed for the business and upcoming payment reminders.": "Argent emprunté pour l’entreprise et rappels des échéances à venir.",
  "Stock purchased": "Stock acheté", "Money from sales": "Revenus des ventes", "Money in loans": "Argent emprunté",
  "Add loan": "Ajouter un prêt", "Source / name": "Source / nom", "Amount": "Montant",
  "Loan date": "Date du prêt", "Deadline": "Échéance", "Interest rate": "Taux d’intérêt",
  "No loans due this month": "Aucun prêt à échéance ce mois-ci", "No loans due this year": "Aucun prêt à échéance cette année",
  "Loans appear here when their repayment deadline falls within the selected period.": "Les prêts apparaissent ici lorsque leur échéance tombe dans la période sélectionnée.",
  "Edit loan": "Modifier le prêt", "Add a loan": "Ajouter un prêt", "Name or money source": "Nom ou source de l’argent",
  "Interest rate (%)": "Taux d’intérêt (%)", "Update loan": "Modifier le prêt", "Save loan": "Enregistrer le prêt",
  "Update the loan details and its automatic reminder schedule.": "Modifiez les détails du prêt et son calendrier de rappels automatiques.",
  "Record where the money came from and when you need to repay it. Reminders are scheduled automatically.": "Indiquez la provenance de l’argent et la date de remboursement. Les rappels sont programmés automatiquement.",
  "Total documents": "Total des documents", "Folders": "Dossiers", "Storage used": "Stockage utilisé",
  "Recently added": "Ajouts récents", "Files saved in your workspace": "Fichiers enregistrés dans votre espace",
  "Folders organizing your files": "Dossiers organisant vos fichiers", "Space currently in use": "Espace actuellement utilisé",
  "Files uploaded this week": "Fichiers téléversés cette semaine", "All Docs": "Tous les documents", "Add a folder": "Ajouter un dossier",
  "Search descriptions": "Rechercher dans les descriptions", "Search photos by description": "Rechercher des photos par description",
  "Filter documents by date": "Filtrer les documents par date", "Add document": "Ajouter un document",
  "No documents yet": "Aucun document pour le moment", "Add documents inside a folder to see them here.": "Ajoutez des documents dans un dossier pour les voir ici.",
  "Document folders": "Dossiers de documents", "Create a folder": "Créer un dossier", "Give your new folder a name.": "Donnez un nom à votre nouveau dossier.",
  "Folder name": "Nom du dossier", "Enter folder name": "Saisir le nom du dossier", "Creating…": "Création…",
  "Create folder": "Créer le dossier", "Photo": "Photo", "Choose photo": "Choisir une photo",
  "No photo selected": "Aucune photo sélectionnée", "Description": "Description", "Describe this photo": "Décrire cette photo",
  "Choose an image and add a description before uploading.": "Choisissez une image et ajoutez une description avant le téléversement.",
  "The folder and every photo inside it will be permanently deleted.": "Le dossier et toutes les photos qu’il contient seront définitivement supprimés.",
  "Loading documents": "Chargement des documents", "View": "Afficher", "Delete": "Supprimer",
  "Upload document": "Téléverser le document", "Delete folder": "Supprimer le dossier", "Delete document": "Supprimer le document",
  "Close document": "Fermer le document", "The image could not be loaded.": "Impossible de charger l’image.",
  "Delete this document?": "Supprimer ce document ?", "The image and its description will be permanently deleted.": "L’image et sa description seront définitivement supprimées.",
  "Settings could not be loaded": "Impossible de charger les paramètres", "Unable to load your profile and business details.": "Impossible de charger votre profil et les informations de votre entreprise.",
  "Try again": "Réessayer", "Dismiss notification": "Ignorer la notification", "Profile and business settings": "Paramètres du profil et de l’entreprise",
  "Profile": "Profil", "Profile picture": "Photo de profil", "Change picture": "Changer la photo",
  "First name": "Prénom", "Last name": "Nom", "Business name": "Nom de l’entreprise", "Save details": "Enregistrer les informations",
  "Dashboard and appearance settings": "Paramètres du tableau de bord et de l’apparence",
  "Dashboard time scope": "Période du tableau de bord", "Default period used by dashboard summaries.": "Période utilisée par défaut dans les résumés du tableau de bord.",
  "Theme": "Thème", "Use a light, dark, or system-matched workspace.": "Utilisez un espace clair, sombre ou adapté au système.",
  "Light": "Clair", "Dark": "Sombre", "System": "Système", "Language": "Langue",
  "English": "Anglais", "French": "Français", "Kinyarwanda": "Kinyarwanda",
  "Mon": "Lun", "Tue": "Mar", "Wed": "Mer", "Thu": "Jeu", "Fri": "Ven", "Sat": "Sam", "Sun": "Dim",
  "Email": "E-mail", "Email ·": "E-mail ·", "Browser push": "Notifications du navigateur", "Browser push ·": "Notifications du navigateur ·", "on": "activé", "off": "désactivé", "saving…": "enregistrement…",
  "Application language": "Langue de l’application", "Notification and reminder settings": "Paramètres des notifications et rappels",
  "Sales reminders": "Rappels de ventes", "Notify you when no sale has been recorded on a working day.": "Vous avertir lorsqu’aucune vente n’a été enregistrée un jour ouvrable.",
  "Noon reminder": "Rappel de midi", "Shown after 12:00 PM.": "Affiché après 12 h.",
  "Evening reminder": "Rappel du soir", "Shown after 8:00 PM.": "Affiché après 20 h.",
  "Working days": "Jours ouvrables", "Sales reminders only appear on selected days.": "Les rappels de ventes apparaissent uniquement les jours sélectionnés.",
  "Loan deadline reminders": "Rappels d’échéance des prêts", "Keep the existing reminders for upcoming loan repayment dates.": "Conservez les rappels pour les prochaines dates de remboursement.",
  "Delivery": "Réception", "Choose where stock, sales, and loan alerts should reach you.": "Choisissez où recevoir les alertes de stock, de ventes et de prêts.",
  "In-app · on": "Dans l’application · activé", "Security settings": "Paramètres de sécurité",
  "Change password": "Changer le mot de passe", "Send change link": "Envoyer le lien de modification",
  "A secure password-change link will be sent to": "Un lien sécurisé de modification du mot de passe sera envoyé à",
  "your email": "votre adresse e-mail", "Loan reminders": "Rappels de prêt", "8 PM reminder": "Rappel de 20 h",
  "Data and account settings": "Paramètres des données et du compte", "Download PDF": "Télécharger le PDF",
  "Delete account": "Supprimer le compte", "This permanently removes your account and cannot be undone.": "Cette action supprime définitivement votre compte et ne peut pas être annulée.",
  "Delete your account?": "Supprimer votre compte ?", "Delete permanently": "Supprimer définitivement",
  "How can we help?": "Comment pouvons-nous vous aider ?", "Still need help?": "Besoin d’aide supplémentaire ?",
  "How do I record a sale?": "Comment enregistrer une vente ?",
  "Open Sales from the sidebar, choose the products and quantities sold, then confirm the sale. Your stock and dashboard totals update automatically.": "Ouvrez Ventes dans la barre latérale, choisissez les produits et les quantités vendues, puis confirmez la vente. Le stock et les totaux du tableau de bord sont mis à jour automatiquement.",
  "How do I add or update stock?": "Comment ajouter ou modifier le stock ?",
  "Go to Stock to add a product, change its quantity, update its price, or organize it into a category.": "Accédez à Inventaire pour ajouter un produit, modifier sa quantité ou son prix, ou le classer dans une catégorie.",
  "How do loan reminders work?": "Comment fonctionnent les rappels de prêt ?",
  "Kungahara shows in-app reminders as repayment deadlines approach. You can turn these reminders on or off from Settings.": "Kungahara affiche des rappels dans l’application à l’approche des échéances. Vous pouvez les activer ou les désactiver dans Paramètres.",
  "Can I download my business records?": "Puis-je télécharger les données de mon entreprise ?",
  "Yes. Open Settings, find Data & account, and choose the sales, stock, loans, or documents export you need.": "Oui. Ouvrez Paramètres, accédez à Données et compte, puis choisissez l’export des ventes, du stock, des prêts ou des documents.",
  "How do I change my account details?": "Comment modifier les informations de mon compte ?",
  "Use Settings to update your name, business name, profile picture, password, appearance, and notification preferences.": "Utilisez Paramètres pour modifier votre nom, le nom de l’entreprise, la photo de profil, le mot de passe, l’apparence et les préférences de notification.",
  "Send us a suggestion or describe a problem.": "Envoyez-nous une suggestion ou décrivez un problème.",
  "Suggestion or problem": "Suggestion ou problème", "Type your message here…": "Écrivez votre message ici…",
  "Your message was emailed to Kungahara support.": "Votre message a été envoyé par e-mail à l’assistance Kungahara.",
  "Send message": "Envoyer le message", "Send": "Envoyer", "Export": "Exporter",
  "stock": "stock", "sales": "ventes", "loans": "prêts",
  "Unable to send your message.": "Impossible d’envoyer votre message."
};

const frenchMonths: Record<string, string> = {
  January: "janvier", February: "février", March: "mars", April: "avril", May: "mai", June: "juin",
  July: "juillet", August: "août", September: "septembre", October: "octobre", November: "novembre", December: "décembre",
};

const patterns: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^Add document to (.+)$/, (m) => `Ajouter un document à ${m[1]}`],
  [/^Delete (.+)\?$/, (m) => `Supprimer ${m[1]} ?`],
  [/^View (.+)$/, (m) => `Afficher ${m[1]}`],
  [/^Delete (.+)$/, (m) => `Supprimer ${m[1]}`],
  [/^Edit sale of (.+)$/, (m) => `Modifier la vente de ${m[1]}`],
  [/^Delete sale of (.+)$/, (m) => `Supprimer la vente de ${m[1]}`],
  [/^All in (.+)$/, (m) => `Tous dans ${m[1]}`],
  [/^Money invested this (month|year)$/, (m) => `Argent investi ${m[1] === "month" ? "ce mois-ci" : "cette année"}`],
  [/^Income this (month|year)$/, (m) => `Revenus ${m[1] === "month" ? "ce mois-ci" : "cette année"}`],
  [/^Profit this (month|year)$/, (m) => `Bénéfice ${m[1] === "month" ? "ce mois-ci" : "cette année"}`],
  [/^Profit made this (month|year)$/, (m) => `Bénéfice réalisé ${m[1] === "month" ? "ce mois-ci" : "cette année"}`],
  [/^(\d+) loans? due this (month|year)$/, (m) => `${m[1]} prêt${m[1] === "1" ? "" : "s"} à rembourser ${m[2] === "month" ? "ce mois-ci" : "cette année"}`],
  [/^Sales in (.+)$/, (m) => `Ventes en ${frenchMonths[m[1]] ?? m[1]}`],
  [/^Sales on (.+)$/, (m) => `Ventes du ${m[1]}`],
  [/^Week (\d+)$/, (m) => `Semaine ${m[1]}`],
  [/^Money invested this (month|year)$/, (m) => `Argent investi ${m[1] === "month" ? "ce mois-ci" : "cette année"}`],
  [/^Income this (month|year)$/, (m) => `Revenus ${m[1] === "month" ? "ce mois-ci" : "cette année"}`],
  [/^Profit this (month|year)$/, (m) => `Bénéfice ${m[1] === "month" ? "ce mois-ci" : "cette année"}`],
  [/^Profit made this (month|year)$/, (m) => `Bénéfice réalisé ${m[1] === "month" ? "ce mois-ci" : "cette année"}`],
  [/^(\d+) loans? due this (month|year)$/, (m) => `${m[1]} prêt${m[1] === "1" ? "" : "s"} à échéance ${m[2] === "month" ? "ce mois-ci" : "cette année"}`],
  [/^(\d+) documents?$/, (m) => `${m[1]} document${m[1] === "1" ? "" : "s"}`],
  [/^(\d+) folders?$/, (m) => `${m[1]} dossier${m[1] === "1" ? "" : "s"}`],
  [/^(\d+) files?$/, (m) => `${m[1]} fichier${m[1] === "1" ? "" : "s"}`],
  [/^(\d+) this week$/, (m) => `${m[1]} cette semaine`],
  [/^Edit (.+) loan$/, (m) => `Modifier le prêt ${m[1]}`],
  [/^Delete (.+) loan$/, (m) => `Supprimer le prêt ${m[1]}`],
  [/^Use (.+)$/, (m) => `Utiliser ${m[1]}`],
  [/^(English|French|Kinyarwanda) is the current application language\.$/, (m) => `${french[m[1]] ?? m[1]} est la langue actuelle de l’application.`],
  [/^Export (stock|sales|loans)$/i, (m) => `Exporter ${m[1].toLowerCase() === "stock" ? "le stock" : m[1].toLowerCase() === "sales" ? "les ventes" : "les prêts"}`],
];

function translate(value: string) {
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const clean = value.trim();
  if (!clean) return value;
  const direct = french[clean];
  if (direct) return leading + direct + trailing;
  for (const [pattern, replacement] of patterns) {
    const match = clean.match(pattern);
    if (match) return leading + replacement(match) + trailing;
  }
  return value;
}

export function useWorkspaceCopy() {
  const locale = useLocale();
  return useCallback((value: string) => locale === "fr" ? translate(value).trim() : value, [locale]);
}

export function WorkspaceCopyTranslator() {
  const locale = useLocale();

  useEffect(() => {
    if (locale !== "fr") return;
    function translateAttributes(element: Element) {
      ["placeholder", "aria-label", "title"].forEach((attribute) => {
        const value = element.getAttribute(attribute);
        if (!value) return;
        const translated = translate(value);
        if (translated !== value) element.setAttribute(attribute, translated);
      });
    }
    const apply = (root: ParentNode) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        if (node.parentElement?.closest("script, style")) continue;
        const translated = translate(node.nodeValue ?? "");
        if (translated !== node.nodeValue) node.nodeValue = translated;
      }
      if (root instanceof Element) translateAttributes(root);
      root.querySelectorAll?.("[placeholder], [aria-label], [title]").forEach(translateAttributes);
    };
    apply(document.querySelector(".dashboard-shell") ?? document.body);
    const observer = new MutationObserver((mutations) => mutations.forEach((mutation) => {
      if (mutation.type === "characterData") {
        const translated = translate(mutation.target.nodeValue ?? "");
        if (translated !== mutation.target.nodeValue) mutation.target.nodeValue = translated;
        return;
      }
      if (mutation.type === "attributes" && mutation.target instanceof Element) {
        translateAttributes(mutation.target);
        return;
      }
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const translated = translate(node.nodeValue ?? "");
          if (translated !== node.nodeValue) node.nodeValue = translated;
        } else if (node instanceof Element) apply(node);
      });
    }));
    observer.observe(document.body, { attributes: true, attributeFilter: ["placeholder", "aria-label", "title"], characterData: true, childList: true, subtree: true });
    return () => observer.disconnect();
  }, [locale]);

  return null;
}
