// app.js

// Define default templates
const defaultTemplates = {
  bonDeCommande: "Bonjour M/Mme. {nom} votre Bon de Commande numéro {reference} d'un montant de {montant} est programmé pour paiement le {date programmation}. Nous vous prions de passer à la caisse de la Trésorerie générale de Yaoundé 2 entre 7H30 et 15H30.\nAttention !!! Ceci est un message généré automatiquement. Veuillez à ne pas y répondre.",
  carburants: "Bonjour M/Mme. {nom} votre carburant objet du bon de commande numéro {reference} d'un montant de {montant} a été viré.\nAttention !!! Ceci est un message généré automatiquement. Veuillez à ne pas y répondre.",
  mission: "Bonjour M/Mme. {nom} votre mission objet du bon de commande numéro {reference} d'un montant de {montant} est programmé pour paiement le {date programmation}. Nous vous prions de passer à la caisse de la Trésorerie générale de Yaoundé 2 entre 7H30 et 15H30.\nAttention !!! Ceci est un message généré automatiquement. Veuillez à ne pas y répondre.",
  emolumentsMagistrats: "Bonjour Maître {nom} votre état d'émolument du Tribunal militaire du {choisir Trimestre} objet du bon de commande numéro {reference} d'un montant de {montant} est programmé pour paiement le {date programmation}. Nous vous prions de passer à la caisse de la Trésorerie générale de Yaoundé 2 entre 7H30 et 15H30.\nAttention !!! Ceci est un message généré automatiquement. Veuillez à ne pas y répondre.",
  emolumentsGreffiers: "Bonjour Maître {nom} votre état d'émolument du {choisir Trimestre} objet du bon de commande numéro {reference} d'un montant de {montant} est programmé pour paiement le {date programmation}. Nous vous prions de passer à la caisse de la Trésorerie générale de Yaoundé 2 entre 7H30 et 15H30.\nAttention !!! Ceci est un message généré automatiquement. Veuillez à ne pas y répondre."
};

// Helper function to load templates from localStorage or use defaults
const loadTemplate = (key) => localStorage.getItem(key) || defaultTemplates[key];

// App Component - Composant principal de l'application
const App = () => {
const [activeTab, setActiveTab] = React.useState('home');
const [beneficiaires, setBeneficiaires] = React.useState([]);
const [dateNotification, setDateNotification] = React.useState(new Date().toISOString().split('T')[0]);
const [searchTerm, setSearchTerm] = React.useState('');
// --- MODIFIED: State for multiple templates ---
const [messageTemplates, setMessageTemplates] = React.useState({
  bonDeCommande: loadTemplate('templateBonDeCommande'),
  carburants: loadTemplate('templateCarburants'),
  mission: loadTemplate('templateMission'),
  emolumentsMagistrats: loadTemplate('templateEmolumentsMagistrats'),
  emolumentsGreffiers: loadTemplate('templateEmolumentsGreffiers')
});
const [notification, setNotification] = React.useState({ show: false, message: '', type: 'success' });
const [isLoading, setIsLoading] = React.useState(false);

// --- MODIFIED: Beneficiary structure (example in comments) ---
// {
//   id: string,
//   nom: string,
//   telephone: string,
//   reference: string,
//   expenditureType: "bonDeCommande" | "carburants" | "mission" | "emolumentsMagistrats" | "emolumentsGreffiers",
//   montant: number | string, // Store as string or number
//   trimestre: "T1" | "T2" | "T3" | "T4" | null, // Only for emoluments types
//   dateAjout: string,
//   notifie: boolean
// }

// Chargement des bénéficiaires depuis localStorage
React.useEffect(() => {
  const storedBeneficiaires = localStorage.getItem('beneficiaires_v2'); // Use new key for updated structure
  if (storedBeneficiaires) {
      try {
          const parsed = JSON.parse(storedBeneficiaires);
          // Basic validation if needed: check if it's an array
          if (Array.isArray(parsed)) {
               setBeneficiaires(parsed);
          } else {
               console.warn("Invalid data found in localStorage for beneficiaries_v2. Resetting.");
               localStorage.removeItem('beneficiaires_v2');
          }
      } catch (error) {
          console.error("Error parsing beneficiaries from localStorage:", error);
          localStorage.removeItem('beneficiaires_v2'); // Clear corrupted data
      }
  }

  const storedDate = localStorage.getItem('dateNotification');
  if (storedDate) {
    setDateNotification(storedDate);
  }

  // --- MODIFIED: Load all templates from localStorage ---
  setMessageTemplates({
      bonDeCommande: loadTemplate('templateBonDeCommande'),
      carburants: loadTemplate('templateCarburants'),
      mission: loadTemplate('templateMission'),
      emolumentsMagistrats: loadTemplate('templateEmolumentsMagistrats'),
      emolumentsGreffiers: loadTemplate('templateEmolumentsGreffiers')
  });
}, []);

// Sauvegarde des bénéficiaires dans localStorage
React.useEffect(() => {
  localStorage.setItem('beneficiaires_v2', JSON.stringify(beneficiaires));
}, [beneficiaires]);

// Sauvegarde de la date de notification dans localStorage
React.useEffect(() => {
  localStorage.setItem('dateNotification', dateNotification);
}, [dateNotification]);

// --- MODIFIED: Sauvegarde des modèles de message ---
React.useEffect(() => {
  Object.keys(messageTemplates).forEach(key => {
      localStorage.setItem(`template${key.charAt(0).toUpperCase() + key.slice(1)}`, messageTemplates[key]);
  });
}, [messageTemplates]);

// --- MODIFIED: Ajout d'un bénéficiaire ---
const ajouterBeneficiaire = (nouveauBeneficiaire) => {
  const beneficiaireAvecId = {
    ...nouveauBeneficiaire,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5), // Ensure unique ID
    dateAjout: new Date().toISOString(),
    notifie: false,
    // Ensure trimestre is null if not applicable
    trimestre: ['emolumentsMagistrats', 'emolumentsGreffiers'].includes(nouveauBeneficiaire.expenditureType) ? nouveauBeneficiaire.trimestre : null
  };

  setBeneficiaires(prev => [...prev, beneficiaireAvecId]);
  showNotification('Bénéficiaire ajouté avec succès', 'success');
};

// --- MODIFIED: Mise à jour d'un bénéficiaire ---
const mettreAJourBeneficiaire = (id, donneesModifiees) => {
  const nouveauxBeneficiaires = beneficiaires.map(benef =>
    benef.id === id ? {
        ...benef,
        ...donneesModifiees,
        // Ensure trimestre is null if type changed and is no longer applicable
        trimestre: ['emolumentsMagistrats', 'emolumentsGreffiers'].includes(donneesModifiees.expenditureType)
                   ? donneesModifiees.trimestre || benef.trimestre // Keep old if not provided in update
                   : null
    } : benef
  );
  setBeneficiaires(nouveauxBeneficiaires);
  showNotification('Bénéficiaire mis à jour avec succès', 'success');
};

// Suppression d'un bénéficiaire
const supprimerBeneficiaire = (id) => {
  const nouveauxBeneficiaires = beneficiaires.filter(benef => benef.id !== id);
  setBeneficiaires(nouveauxBeneficiaires);
  showNotification('Bénéficiaire supprimé', 'info');
};

// Filtrage des bénéficiaires
const beneficiairesFiltres = beneficiaires.filter(benef =>
  benef.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
  benef.telephone.includes(searchTerm) ||
  benef.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
  benef.expenditureType.toLowerCase().includes(searchTerm.toLowerCase()) // Optional: search by type
);

// --- MODIFIED: Importation des bénéficiaires (NEEDS ADJUSTMENT FOR NEW FIELDS) ---
const importerBeneficiaires = (data) => {
  // IMPORTANT: This needs modification if you want to import the new fields.
  // You'll need columns like 'Type Depense', 'Montant', 'Trimestre' in your Excel/CSV.
  // Add logic here to map those columns to the new beneficiary structure.
  const nouveauxBeneficiaires = data.map(row => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    nom: row.Nom || row.nom || '',
    telephone: String(row.Téléphone || row.Telephone || row.telephone || ''),
    reference: String(row.Référence || row.Reference || row.reference || ''),
    // --- EXAMPLE: Defaulting imported type and amount ---
    expenditureType: 'bonDeCommande', // Default or try to parse from file
    montant: row.Montant || row.montant || '0', // Default or try to parse
    trimestre: null, // Default or try to parse if applicable
    // --- End Example ---
    dateAjout: new Date().toISOString(),
    notifie: false,
    // Remove old modePaiement if it exists from previous versions
    modePaiement: undefined
  })).filter(b => b.nom && b.telephone && b.reference); // Basic validation

  if (nouveauxBeneficiaires.length === 0 && data.length > 0) {
    showNotification("Erreur lors de l'importation. Vérifiez les noms des colonnes (Nom, Téléphone, Référence, Montant?, Type Depense?, Trimestre?) et le format du fichier.", 'error');
    return;
  }

  setBeneficiaires(prev => [...prev, ...nouveauxBeneficiaires]);
  showNotification(`${nouveauxBeneficiaires.length} bénéficiaires importés (type/montant peuvent nécessiter une mise à jour manuelle)`, 'warning'); // Warn user about potential defaults
};

// --- MODIFIED: Génération du message SMS pour un bénéficiaire ---
const genererMessageSMS = (beneficiaire) => {
  let template = '';
  const type = beneficiaire.expenditureType;

  // Select the correct template
  switch (type) {
      case 'bonDeCommande': template = messageTemplates.bonDeCommande; break;
      case 'carburants': template = messageTemplates.carburants; break;
      case 'mission': template = messageTemplates.mission; break;
      case 'emolumentsMagistrats': template = messageTemplates.emolumentsMagistrats; break;
      case 'emolumentsGreffiers': template = messageTemplates.emolumentsGreffiers; break;
      default: return `Type de dépense inconnu: ${type}`; // Handle unknown type
  }

  // Format amount nicely (e.g., with spaces for thousands, and currency symbol if desired)
  // This is a basic example, you might want a more robust formatting library
  const formattedMontant = beneficiaire.montant ? Number(beneficiaire.montant).toLocaleString('fr-FR') + ' FCFA' : '[MONTANT MANQUANT]'; // Adjust locale and currency as needed

  // Replace placeholders
  let message = template;
  message = message.replace(/{nom}/g, beneficiaire.nom || '[NOM MANQUANT]');
  message = message.replace(/{reference}/g, beneficiaire.reference || '[REFERENCE MANQUANTE]');
  message = message.replace(/{montant}/g, formattedMontant);
  message = message.replace(/{date programmation}/g, new Date(dateNotification).toLocaleDateString('fr-FR') || '[DATE MANQUANTE]'); // Use specific placeholder name
  message = message.replace(/{choisir Trimestre}/g, beneficiaire.trimestre || '[TRIMESTRE MANQUANT]'); // Use specific placeholder name

  // Deprecated placeholders - remove or replace if they exist in old templates
  message = message.replace(/{date}/g, new Date(dateNotification).toLocaleDateString('fr-FR')); // Keep for backward compat if needed

  return message;
};

// --- Envoi des notifications via le backend (Unchanged, relies on genererMessageSMS) ---
  const envoyerNotifications = async (beneficiairesSelectionnesIds) => {
      if (beneficiairesSelectionnesIds.length === 0) {
      showNotification('Veuillez sélectionner au moins un bénéficiaire.', 'warning');
      return;
      }

      const backendUrl = 'http://localhost:3001/api/send-sms'; // Ensure your server.js is running

      setIsLoading(true);
      showNotification(`Préparation de ${beneficiairesSelectionnesIds.length} notifications...`, 'info');

      const messagesToSend = beneficiaires
          .filter(benef => beneficiairesSelectionnesIds.includes(benef.id))
          .map(benef => ({
              to: benef.telephone,
              body: genererMessageSMS(benef), // This now uses the dynamic template logic
              beneficiaryId: benef.id
          }));

      if (messagesToSend.length === 0) {
          setIsLoading(false);
          showNotification('Aucun message à envoyer pour les bénéficiaires sélectionnés.', 'warning');
          return;
      }

      try {
          showNotification('Envoi des notifications en cours via le serveur...', 'info');
          const response = await fetch(backendUrl, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ messages: messagesToSend }),
          });

          if (!response.ok) {
              let errorMsg = `Erreur serveur: ${response.status} ${response.statusText}`;
              try {
                  const errorData = await response.json();
                  errorMsg = errorData.message || errorData.error || errorMsg;
              } catch (e) { /* Ignore parsing error */ }
              throw new Error(errorMsg);
          }

          const result = await response.json();

          let successfulSends = 0;
          let failedSends = 0;
          const updatedBeneficiaires = beneficiaires.map(benef => {
              const sendResult = result.results?.find(r => r.beneficiaryId === benef.id);
              if (sendResult) {
                  if (sendResult.status === 'sent' || sendResult.status === 'queued' || sendResult.status === 'accepted' ) { // Adjust success statuses based on Twilio/backend response
                      successfulSends++;
                      return { ...benef, notifie: true };
                  } else {
                      failedSends++;
                      console.error(`Échec SMS pour ${benef.nom} (${benef.id}): ${sendResult.message || sendResult.status}`);
                  }
              }
              return benef;
          });

          setBeneficiaires(updatedBeneficiaires);

          let finalMessage = '';
          let finalType = 'success';

          if (successfulSends > 0 && failedSends === 0) {
              finalMessage = `${successfulSends} notifications envoyées avec succès.`;
          } else if (successfulSends > 0 && failedSends > 0) {
              finalMessage = `${successfulSends} notifications envoyées, ${failedSends} échecs. Vérifiez la console du navigateur ou les logs du serveur pour les détails.`;
              finalType = 'warning';
          } else if (successfulSends === 0 && failedSends > 0) {
              finalMessage = `Échec de l'envoi de ${failedSends} notifications. Vérifiez les détails.`;
              finalType = 'error';
          } else if (result.success && result.results?.length === beneficiairesSelectionnesIds.length) {
              // General success message if backend provides less detail but indicates overall success
              finalMessage = result.message || `${beneficiairesSelectionnesIds.length} notifications traitées par le serveur.`;
               setBeneficiaires(beneficiaires.map(benef =>
                  beneficiairesSelectionnesIds.includes(benef.id) ? { ...benef, notifie: true } : benef
               ));
          } else {
              // Fallback message
               finalMessage = `Traitement terminé. Succès: ${successfulSends}, Échecs: ${failedSends}. Message serveur: ${result.message || 'N/A'}`;
               finalType = hasFailures ? 'warning' : 'info';
          }
          showNotification(finalMessage, finalType);

      } catch (error) {
          console.error('Erreur lors de l\'envoi des notifications:', error);
          showNotification(`Erreur: ${error.message}`, 'error');
      } finally {
          setIsLoading(false);
      }
  };


// Affichage d'une notification
const showNotification = (message, type = 'info') => {
  setNotification({ show: true, message, type });
  const timeout = (type === 'error' || type === 'warning') ? 6000 : 4000; // Longer timeout
  setTimeout(() => setNotification({ show: false, message: '', type: 'info' }), timeout);
};

// Tout effacer
const toutEffacer = () => {
  if (confirm('Êtes-vous sûr de vouloir supprimer TOUS les bénéficiaires ? Cette action est irréversible.')) {
    setBeneficiaires([]);
    showNotification('Tous les bénéficiaires ont été supprimés', 'info');
    localStorage.removeItem('beneficiaires_v2'); // Clear storage with the new key
  }
};

// Helper to get display name for expenditure type
const getExpenditureTypeDisplayName = (typeKey) => {
    switch (typeKey) {
        case 'bonDeCommande': return 'Bon de Commande';
        case 'carburants': return 'Carburants';
        case 'mission': return 'Mission';
        case 'emolumentsMagistrats': return 'Émoluments Magistrats';
        case 'emolumentsGreffiers': return 'Émoluments Greffiers';
        default: return typeKey; // Fallback
    }
};

return (
  <div className="app-container p-4">
    {/* En-tête */}
    <header className="text-white p-6 rounded-lg shadow-md mb-6">
      <h1 className="text-2xl font-bold text-center">Notification des Paiements V2</h1>
      <p className="text-center text-sm opacity-90 mt-1">Envoyez des SMS aux bénéficiaires pour les informer de leurs paiements</p>
    </header>

    {/* Navigation */}
     <div className="tab-nav flex mb-4 bg-white rounded-lg shadow-sm overflow-x-auto">
       {/* ... (Navigation buttons unchanged) ... */}
      <button
        className={`px-4 py-2 flex-1 text-sm md:text-base ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => setActiveTab('home')}>
        Accueil
      </button>
      <button
        className={`px-4 py-2 flex-1 text-sm md:text-base ${activeTab === 'import' ? 'active' : ''}`}
        onClick={() => setActiveTab('import')}>
        Importer
      </button>
      <button
        className={`px-4 py-2 flex-1 text-sm md:text-base ${activeTab === 'add' ? 'active' : ''}`}
        onClick={() => setActiveTab('add')}>
        Ajouter
      </button>
      <button
        className={`px-4 py-2 flex-1 text-sm md:text-base ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => setActiveTab('settings')}>
        Modèles SMS
      </button>
    </div>

    {/* Notification */}
    {notification.show && (
      <div className={`notification ${notification.type}`}>
        {notification.message}
         {isLoading && !notification.message.toLowerCase().includes('envoi en cours') && ( // Show spinner only if not already indicated in message
              <svg className="loading-spinner h-4 w-4 inline-block ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
         )}
      </div>
    )}

    {/* Contenu principal */}
    <main className="bg-white rounded-lg shadow-md p-4">
      {activeTab === 'home' && (
        <HomeTab
          beneficiaires={beneficiairesFiltres}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          dateNotification={dateNotification}
          setDateNotification={setDateNotification}
          supprimerBeneficiaire={supprimerBeneficiaire}
          mettreAJourBeneficiaire={mettreAJourBeneficiaire} // Pass the modified update function
          envoyerNotifications={envoyerNotifications}
          genererMessageSMS={genererMessageSMS} // Pass the modified generator
          toutEffacer={toutEffacer}
          isLoading={isLoading}
          setActiveTab={setActiveTab}
          getExpenditureTypeDisplayName={getExpenditureTypeDisplayName} // Pass helper function
        />
      )}

      {activeTab === 'import' && (
        <ImportTab importerBeneficiaires={importerBeneficiaires} />
      )}

      {activeTab === 'add' && (
        <AddTab
          ajouterBeneficiaire={ajouterBeneficiaire} // Pass the modified add function
          messageTemplates={messageTemplates} // Pass templates for preview
          dateNotification={dateNotification}
          genererMessageSMS={genererMessageSMS} // Pass generator for preview
          getExpenditureTypeDisplayName={getExpenditureTypeDisplayName} // Pass helper function
        />
      )}

      {activeTab === 'settings' && (
        <SettingsTab
          messageTemplates={messageTemplates} // Pass the template state
          setMessageTemplates={setMessageTemplates} // Pass the setter
          showNotification={showNotification}
          defaultTemplates={defaultTemplates} // Pass defaults for reset
          getExpenditureTypeDisplayName={getExpenditureTypeDisplayName} // Pass helper function
        />
      )}
    </main>

    {/* Pied de page */}
    <footer className="mt-6 text-center text-gray-500 text-sm">
      <p>© {new Date().getFullYear()} Notification des Paiements V2</p>
    </footer>
  </div>
);
};

// --- MODIFIED HomeTab ---
const HomeTab = ({
beneficiaires,
searchTerm,
setSearchTerm,
dateNotification,
setDateNotification,
supprimerBeneficiaire,
mettreAJourBeneficiaire, // Receives modified updater
envoyerNotifications,
genererMessageSMS, // Receives modified generator
toutEffacer,
isLoading,
setActiveTab,
getExpenditureTypeDisplayName // Receive helper
}) => {
const [selectedBeneficiaires, setSelectedBeneficiaires] = React.useState([]);
const [showPreview, setShowPreview] = React.useState(false);
const [previewBeneficiaire, setPreviewBeneficiaire] = React.useState(null);
const [editingBeneficiaire, setEditingBeneficiaire] = React.useState(null); // Stores the *entire* beneficiary object being edited

React.useEffect(() => {
   setSelectedBeneficiaires([]);
}, [beneficiaires]);

const toggleSelection = (id) => {
  setSelectedBeneficiaires(prevSelected =>
      prevSelected.includes(id)
          ? prevSelected.filter(b => b !== id)
          : [...prevSelected, id]
  );
};

const toggleSelectAll = () => {
  if (selectedBeneficiaires.length === beneficiaires.length) {
    setSelectedBeneficiaires([]);
  } else {
    setSelectedBeneficiaires(beneficiaires.map(b => b.id));
  }
};

const previewMessage = (beneficiaire) => {
  setPreviewBeneficiaire(beneficiaire);
  setShowPreview(true);
};

const closePreview = () => {
  setShowPreview(false);
  setPreviewBeneficiaire(null);
};

const startEditing = (beneficiaire) => {
  // Clone the beneficiary to avoid modifying the original state directly during edits
  setEditingBeneficiaire(JSON.parse(JSON.stringify(beneficiaire)));
};

const saveChanges = () => {
  if (editingBeneficiaire) {
    // Validation
    if (!editingBeneficiaire.nom?.trim() || !editingBeneficiaire.telephone?.trim() || !editingBeneficiaire.reference?.trim() || !editingBeneficiaire.expenditureType || !editingBeneficiaire.montant) {
      alert("Veuillez remplir tous les champs obligatoires (Nom, Téléphone, Référence, Type de dépense, Montant).");
      return;
    }
     if (['emolumentsMagistrats', 'emolumentsGreffiers'].includes(editingBeneficiaire.expenditureType) && !editingBeneficiaire.trimestre) {
       alert("Veuillez sélectionner un trimestre pour ce type de dépense.");
       return;
     }
     // Basic amount validation
      if (isNaN(parseFloat(editingBeneficiaire.montant)) || parseFloat(editingBeneficiaire.montant) < 0) {
          alert("Le montant doit être un nombre positif.");
          return;
      }

    mettreAJourBeneficiaire(editingBeneficiaire.id, editingBeneficiaire);
    setEditingBeneficiaire(null); // Exit editing mode
  }
};

const cancelEditing = () => {
  setEditingBeneficiaire(null);
};

// --- MODIFIED: Handle changes in the edit form ---
const handleEditChange = (e) => {
  const { name, value, type } = e.target;
  setEditingBeneficiaire(prev => {
      const updated = { ...prev, [name]: value };
      // If expenditureType changes, reset trimestre if it's no longer applicable
      if (name === 'expenditureType' && !['emolumentsMagistrats', 'emolumentsGreffiers'].includes(value)) {
          updated.trimestre = null;
      }
      return updated;
  });
};

return (
  <div>
    {/* Date de paiement */}
    <div className="mb-6 date-container flex items-center p-4 rounded-lg">
        {/* ... Date input unchanged ... */}
      <div className="date-icon mr-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <div className="flex-grow">
        <label htmlFor="dateNotifInput" className="block text-sm font-medium text-gray-700">Date de programmation (pour SMS)</label>
        <input
          id="dateNotifInput"
          type="date"
          value={dateNotification}
          onChange={(e) => setDateNotification(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
        />
      </div>
      <div className="ml-4 text-sm text-gray-600 hidden md:block">
        Cette date sera utilisée dans les messages SMS (variable {"{date programmation}"}).
      </div>
    </div>

    {/* Recherche et contrôles */}
    <div className="mb-4 flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0 md:space-x-2">
      <div className="w-full md:flex-grow">
        <input
          type="text"
          placeholder="Rechercher (Nom, Tél, Réf, Type)..." // Updated placeholder
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex items-center space-x-2 flex-shrink-0">
         {/* ... Select All / Clear All buttons unchanged ... */}
        <button
          onClick={toggleSelectAll}
          className="btn btn-outline text-xs sm:text-sm"
          disabled={beneficiaires.length === 0 || isLoading}
        >
          {selectedBeneficiaires.length === beneficiaires.length ? 'Tout Désélec.' : 'Tout Sélec.'}
        </button>
        <button
          onClick={toutEffacer}
          className="btn btn-outline btn-danger text-xs sm:text-sm" // Added danger style
          disabled={beneficiaires.length === 0 || isLoading}
        >
          Tout Effacer
        </button>
      </div>
    </div>

    {/* Liste des bénéficiaires */}
    <div className="beneficiary-list-container overflow-y-auto" style={{ maxHeight: '55vh' }}> {/* Increased max height */}
      <h3 className="text-lg font-medium mb-2 sticky top-0 bg-white py-2 z-10 border-b"> {/* Added border */}
          Liste ({beneficiaires.length})
          {selectedBeneficiaires.length > 0 && ` - ${selectedBeneficiaires.length} sélectionné(s)`}
      </h3>

      {beneficiaires.length === 0 ? (
           <div className="text-center p-8 bg-gray-50 rounded-lg">
               {/* ... No Beneficiaries message unchanged ... */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="mt-2 text-gray-600">Aucun bénéficiaire ajouté</p>
              <p className="text-sm text-gray-500 mt-1">Commencez par importer un fichier ou ajouter manuellement</p>
           </div>
      ) : (
        <div className="space-y-3">
          {beneficiaires.map(beneficiaire => (
            <div key={beneficiaire.id} className={`beneficiary-card p-3 md:p-4 rounded-lg border ${selectedBeneficiaires.includes(beneficiaire.id) ? 'selected' : ''} ${beneficiaire.notifie ? 'opacity-70' : ''}`}>
              {editingBeneficiaire && editingBeneficiaire.id === beneficiaire.id ? (
                // --- MODIFIED: Mode édition ---
                <div className="space-y-3">
                  {/* Row 1: Nom, Telephone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Nom <span className="text-red-500">*</span></label>
                      <input type="text" name="nom" value={editingBeneficiaire.nom} onChange={handleEditChange} required className="form-input text-sm p-2"/>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone <span className="text-red-500">*</span></label>
                      <input type="tel" name="telephone" value={editingBeneficiaire.telephone} onChange={handleEditChange} required className="form-input text-sm p-2"/>
                    </div>
                  </div>
                   {/* Row 2: Référence, Montant */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Référence <span className="text-red-500">*</span></label>
                      <input type="text" name="reference" value={editingBeneficiaire.reference} onChange={handleEditChange} required className="form-input text-sm p-2"/>
                    </div>
                     <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Montant (FCFA) <span className="text-red-500">*</span></label>
                      <input type="number" step="any" name="montant" value={editingBeneficiaire.montant} onChange={handleEditChange} required className="form-input text-sm p-2"/>
                    </div>
                  </div>
                   {/* Row 3: Type Depense, Trimestre (Conditional) */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Type de Dépense <span className="text-red-500">*</span></label>
                      <select name="expenditureType" value={editingBeneficiaire.expenditureType} onChange={handleEditChange} required className="form-select text-sm p-2">
                          <option value="" disabled>-- Sélectionner --</option>
                          <option value="bonDeCommande">{getExpenditureTypeDisplayName('bonDeCommande')}</option>
                          <option value="carburants">{getExpenditureTypeDisplayName('carburants')}</option>
                          <option value="mission">{getExpenditureTypeDisplayName('mission')}</option>
                          <option value="emolumentsMagistrats">{getExpenditureTypeDisplayName('emolumentsMagistrats')}</option>
                          <option value="emolumentsGreffiers">{getExpenditureTypeDisplayName('emolumentsGreffiers')}</option>
                      </select>
                    </div>
                     {/* Conditional Trimestre */}
                    {['emolumentsMagistrats', 'emolumentsGreffiers'].includes(editingBeneficiaire.expenditureType) && (
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Trimestre <span className="text-red-500">*</span></label>
                            <select name="trimestre" value={editingBeneficiaire.trimestre || ''} onChange={handleEditChange} required className="form-select text-sm p-2">
                                <option value="" disabled>-- Sélectionner --</option>
                                <option value="T1">T1</option>
                                <option value="T2">T2</option>
                                <option value="T3">T3</option>
                                <option value="T4">T4</option>
                            </select>
                        </div>
                    )}
                   </div>

                  {/* Save/Cancel Buttons */}
                  <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={cancelEditing} className="btn btn-outline text-sm">Annuler</button>
                    <button onClick={saveChanges} className="btn btn-primary text-sm">Enregistrer</button>
                  </div>
                </div>
              ) : (
                // --- MODIFIED: Mode affichage ---
                <div className="flex flex-col sm:flex-row justify-between items-start">
                  {/* Left Side: Checkbox and Info */}
                  <div className="flex items-start mb-2 sm:mb-0 flex-grow">
                    <input
                      type="checkbox"
                      checked={selectedBeneficiaires.includes(beneficiaire.id)}
                      onChange={() => toggleSelection(beneficiaire.id)}
                      disabled={isLoading}
                      className="mt-1 mr-3 h-5 w-5 cursor-pointer accent-primary flex-shrink-0"
                    />
                    <div className="flex-grow">
                      <h4 className="font-medium text-sm md:text-base break-words">{beneficiaire.nom}</h4>
                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-xs md:text-sm text-gray-600 mt-1">
                        {/* Telephone */}
                        <span className="flex items-center truncate" title={beneficiaire.telephone}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                           {beneficiaire.telephone}
                        </span>
                        {/* Reference */}
                         <span className="flex items-center truncate" title={beneficiaire.reference}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                          Réf: {beneficiaire.reference}
                        </span>
                         {/* Montant */}
                         <span className="flex items-center font-medium" title={`${Number(beneficiaire.montant || 0).toLocaleString('fr-FR')} FCFA`}>
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            {Number(beneficiaire.montant || 0).toLocaleString('fr-FR')} FCFA
                         </span>
                         {/* Type */}
                         <span className="flex items-center col-span-1 md:col-span-2 lg:col-span-1" title={getExpenditureTypeDisplayName(beneficiaire.expenditureType)}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                              {getExpenditureTypeDisplayName(beneficiaire.expenditureType)}
                              {/* Display Trimestre if applicable */}
                              {beneficiaire.trimestre && ` (${beneficiaire.trimestre})`}
                         </span>
                      </div>
                      {/* Notification Status */}
                      {beneficiaire.notifie && (
                         <span className="inline-block mt-1 px-2 py-0.5 badge badge-success text-xs">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Notifié
                         </span>
                      )}
                    </div>
                  </div>
                  {/* Action buttons (Right Side) */}
                  <div className="flex mt-2 sm:mt-0 space-x-1 flex-shrink-0 self-start sm:self-center">
                     {/* ... Preview, Edit, Delete buttons unchanged ... */}
                      <button
                          onClick={() => previewMessage(beneficiaire)}
                          disabled={isLoading}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Prévisualiser SMS"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      <button
                          onClick={() => startEditing(beneficiaire)}
                          disabled={isLoading}
                          className="p-1 text-amber-600 hover:bg-amber-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Modifier"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button
                          onClick={() => { if (confirm(`Supprimer ${beneficiaire.nom} ?`)) supprimerBeneficiaire(beneficiaire.id);}}
                          disabled={isLoading}
                          className="p-1 text-red-600 hover:bg-red-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Supprimer"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Bouton d'envoi */}
    <div className="mt-6">
       {/* ... Send button unchanged ... */}
      <button
        onClick={() => envoyerNotifications(selectedBeneficiaires)}
        disabled={selectedBeneficiaires.length === 0 || isLoading}
        className={`btn btn-lg btn-block ${isLoading ? 'btn-outline' : (selectedBeneficiaires.length === 0 ? 'btn-outline' : 'btn-success pushed')}`}
      >
       {isLoading ? (
          <>
            <svg className="loading-spinner h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Envoi en cours...
          </>
        ) : (
          <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Envoyer les notifications ({selectedBeneficiaires.length})
          </>
        )}
      </button>
    </div>

    {/* --- MODIFIED: Modal de prévisualisation --- */}
    {showPreview && previewBeneficiaire && (
      <div className="modal-overlay">
        <div className="modal-container">
          <div className="modal-header">
            <h3 className="modal-title">Prévisualisation du message</h3>
            <button onClick={closePreview} className="modal-close">
               {/* ... Close icon unchanged ... */}
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
            </button>
          </div>
          <div className="modal-body">
            {/* Generated Message */}
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <p className="text-gray-800 whitespace-pre-wrap">{genererMessageSMS(previewBeneficiaire)}</p>
            </div>
            {/* Beneficiary Details */}
            <div className="text-sm text-gray-600 border-t pt-3">
               <p><strong>Bénéficiaire:</strong> {previewBeneficiaire.nom}</p>
               <p className="mt-1"><strong>Téléphone:</strong> {previewBeneficiaire.telephone}</p>
               <p className="mt-1"><strong>Référence:</strong> {previewBeneficiaire.reference}</p>
               <p className="mt-1"><strong>Type:</strong> {getExpenditureTypeDisplayName(previewBeneficiaire.expenditureType)} {previewBeneficiaire.trimestre ? `(${previewBeneficiaire.trimestre})` : ''}</p>
               <p className="mt-1"><strong>Montant:</strong> {Number(previewBeneficiaire.montant || 0).toLocaleString('fr-FR')} FCFA</p>
               <p className="mt-1"><strong>Date Programmation (SMS):</strong> {new Date(dateNotification).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
          <div className="modal-footer">
            <button
              onClick={() => {
                closePreview();
                setActiveTab('settings');
              }}
              className="btn btn-outline"
            >
              Éditer les modèles
            </button>
            <button onClick={closePreview} className="btn btn-primary">
              Fermer
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
};


// --- ImportTab (Largely unchanged, but needs columns update for full import) ---
const ImportTab = ({ importerBeneficiaires }) => {
  // ... existing import logic ...
  // Reminder: importerBeneficiaires function in App component needs adjustment
  // if you want to import the new fields (expenditureType, montant, trimestre)
  // from Excel/CSV. The current implementation uses defaults.

  // ... (rest of ImportTab component code is unchanged) ...
    const [dragActive, setDragActive] = React.useState(false);
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [processedData, setProcessedData] = React.useState(null);
    const fileInputRef = React.useRef(null);

    const handleDrag = (e) => { /* ... unchanged ... */
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
        } else if (e.type === "dragleave") {
        setDragActive(false);
        }
    };

    const handleDrop = (e) => { /* ... unchanged ... */
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => { /* ... unchanged ... */
        if (e.target.files && e.target.files[0]) {
        processFile(e.target.files[0]);
        e.target.value = null; // Reset file input
        }
    };

    const onButtonClick = () => { /* ... unchanged ... */ fileInputRef.current.click(); };

    const processFile = (file) => { /* ... unchanged ... */
        setIsProcessing(true);
        setProcessedData(null); // Clear previous preview

        const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
        if (!validTypes.includes(file.type)) {
             alert("Format de fichier non supporté. Veuillez sélectionner un fichier Excel (.xlsx, .xls) ou CSV (.csv).");
             setIsProcessing(false);
             return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
        try {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheet];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (!jsonData || jsonData.length === 0) {
                 throw new Error("Le fichier est vide ou n'a pas pu être lu.");
            }

            const headers = Object.keys(jsonData[0] || {});
            const lowerCaseHeaders = headers.map(h => h.toLowerCase().trim());
            // Basic required headers check (adapt if new fields are mandatory for import)
            const requiredHeaders = ['nom', 'telephone', 'téléphone', 'reference', 'référence'];
            const hasRequiredHeaders = requiredHeaders.some(reqHeader => lowerCaseHeaders.includes(reqHeader));

             // Slightly relaxed check: Ensure at least one required header is present
             if (!hasRequiredHeaders && jsonData.length > 0) {
                 console.warn("En-têtes attendus (Nom, Téléphone, Référence) non trouvés ou mal orthographiés. L'importation pourrait échouer ou nécessiter des modifications manuelles.");
                 // Allow import but warn
             }

            setProcessedData({
            fileName: file.name,
            rowCount: jsonData.length,
            headers: headers,
            data: jsonData,
            preview: jsonData.slice(0, 5) // Show preview rows
            });
        } catch (error) {
            console.error("Erreur lors du traitement du fichier:", error);
            alert(`Erreur lors du traitement du fichier: ${error.message}`);
            setProcessedData(null);
        } finally {
            setIsProcessing(false);
        }
        };
         reader.onerror = (e) => { /* ... unchanged ... */
            console.error("Erreur de lecture du fichier:", e);
            alert("Une erreur s'est produite lors de la lecture du fichier.");
            setIsProcessing(false);
         };
        reader.readAsArrayBuffer(file);
    };

    const confirmerImport = () => { /* ... unchanged ... */
        if (processedData && processedData.data) {
        importerBeneficiaires(processedData.data);
        setProcessedData(null); // Clear preview after successful import attempt
        }
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Importation depuis Excel/CSV</h2>

            {/* Zone de dépôt de fichier */}
            <form
                className={`file-upload-area ${dragActive ? 'drag-over' : ''}`}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                onSubmit={(e) => e.preventDefault()}
            >
                {/* ... unchanged file input and drop zone content ... */}
                <input ref={fileInputRef} type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileChange}/>
                <div className="upload-icon mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                </div>
                <p className="text-gray-700 mb-2">Glissez-déposez votre fichier ici, ou</p>
                <button type="button" onClick={onButtonClick} className="btn btn-primary" disabled={isProcessing}>Sélectionner un fichier</button>
                <p className="text-sm text-gray-500 mt-4">
                    Formats supportés: .xlsx, .xls, .csv<br />
                    Colonnes recommandées: <strong>Nom, Téléphone, Référence</strong><br/>
                    Colonnes optionnelles: Montant, Type Depense, Trimestre (utiliser les noms exacts pour une meilleure importation)
                </p>
            </form>

            {/* Affichage pendant le traitement */}
            {isProcessing && ( /* ... unchanged loading indicator ... */
                <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center justify-center">
                    <svg className="loading-spinner h-5 w-5 mr-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Traitement du fichier en cours...</span>
                </div>
            )}

            {/* Prévisualisation des données */}
            {processedData && ( /* ... unchanged preview table ... */
                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Aperçu de l'importation</h3>
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{processedData.rowCount} lignes détectées</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Fichier: <span className="font-medium">{processedData.fileName}</span></p>
                    <div className="mt-3 overflow-x-auto">
                        <table className="min-w-full border border-gray-300 rounded text-xs">
                            <thead className="bg-gray-100"><tr>{processedData.headers.map((header, index) => (<th key={index} className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider border-b">{header}</th>))}</tr></thead>
                            <tbody className="bg-white divide-y divide-gray-200">{processedData.preview.map((row, rowIndex) => (<tr key={rowIndex}>{processedData.headers.map((header, colIndex) => (<td key={colIndex} className="px-3 py-2 whitespace-nowrap text-gray-700">{String(row[header] ?? '')}</td>))}</tr>))}</tbody>
                        </table>
                    </div>
                    {processedData.rowCount > processedData.preview.length && (<p className="text-sm text-gray-500 mt-2 italic">... et {processedData.rowCount - processedData.preview.length} autres lignes</p>)}
                    <div className="mt-4 flex justify-end space-x-3">
                        <button onClick={() => setProcessedData(null)} className="btn btn-outline">Annuler</button>
                        <button onClick={confirmerImport} className="btn btn-primary">Confirmer et Importer</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- MODIFIED AddTab ---
const AddTab = ({
  ajouterBeneficiaire,
  messageTemplates, // Receive templates object
  dateNotification,
  genererMessageSMS, // Receive generator function
  getExpenditureTypeDisplayName // Receive helper
}) => {
const [nouveauBeneficiaire, setNouveauBeneficiaire] = React.useState({
  nom: '',
  telephone: '',
  reference: '',
  expenditureType: '', // Default to empty
  montant: '',
  trimestre: '' // Default to empty
});

const handleChange = (e) => {
  const { name, value } = e.target;
  setNouveauBeneficiaire(prev => {
      const updated = {...prev, [name]: value };
      // Reset trimestre if type changes and is no longer applicable
      if (name === 'expenditureType' && !['emolumentsMagistrats', 'emolumentsGreffiers'].includes(value)) {
          updated.trimestre = ''; // Reset to default empty
      }
      return updated;
  });
};

const handleSubmit = (e) => {
  e.preventDefault();

  // Validation
  if (!nouveauBeneficiaire.nom.trim() || !nouveauBeneficiaire.telephone.trim() || !nouveauBeneficiaire.reference.trim() || !nouveauBeneficiaire.expenditureType || !nouveauBeneficiaire.montant) {
    alert("Veuillez remplir tous les champs obligatoires (Nom, Téléphone, Référence, Type de dépense, Montant).");
    return;
  }
   if (['emolumentsMagistrats', 'emolumentsGreffiers'].includes(nouveauBeneficiaire.expenditureType) && !nouveauBeneficiaire.trimestre) {
     alert("Veuillez sélectionner un trimestre pour ce type de dépense.");
     return;
   }
   if (isNaN(parseFloat(nouveauBeneficiaire.montant)) || parseFloat(nouveauBeneficiaire.montant) < 0) {
       alert("Le montant doit être un nombre positif.");
       return;
   }

  // --- TODO: Add phone number validation ---

  ajouterBeneficiaire(nouveauBeneficiaire);

  // Reset form
  setNouveauBeneficiaire({
    nom: '', telephone: '', reference: '', expenditureType: '', montant: '', trimestre: ''
  });
};

// Generate preview message based on current form state
 const generatePreviewMessage = () => {
    // Create a temporary beneficiary object matching the expected structure for genererMessageSMS
    const previewData = {
        ...nouveauBeneficiaire,
        nom: nouveauBeneficiaire.nom.trim() || '[NOM]',
        reference: nouveauBeneficiaire.reference.trim() || '[RÉFÉRENCE]',
        montant: nouveauBeneficiaire.montant || 0,
        trimestre: nouveauBeneficiaire.trimestre || null // Ensure null if empty
    };
    if (!previewData.expenditureType) return "Sélectionnez un type de dépense pour voir l'aperçu.";
    return genererMessageSMS(previewData);
 };

return (
  <div>
    <h2 className="text-xl font-semibold mb-4">Ajout manuel d'un bénéficiaire</h2>

    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Row 1: Nom, Telephone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label htmlFor="nom" className="form-label">Nom <span className="text-red-500">*</span></label>
            <input type="text" id="nom" name="nom" value={nouveauBeneficiaire.nom} onChange={handleChange} placeholder="Nom complet" className="form-input" required />
          </div>
          <div className="form-group">
            <label htmlFor="telephone" className="form-label">Téléphone <span className="text-red-500">*</span></label>
            <input type="tel" id="telephone" name="telephone" value={nouveauBeneficiaire.telephone} onChange={handleChange} placeholder="+237..." className="form-input" required />
            <p className="form-hint">Format international recommandé.</p>
          </div>
      </div>

      {/* Row 2: Référence, Montant */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="form-group">
              <label htmlFor="reference" className="form-label">Référence / N° Bon <span className="text-red-500">*</span></label>
              <input type="text" id="reference" name="reference" value={nouveauBeneficiaire.reference} onChange={handleChange} placeholder="Référence du paiement" className="form-input" required />
           </div>
           <div className="form-group">
              <label htmlFor="montant" className="form-label">Montant (FCFA) <span className="text-red-500">*</span></label>
              <input type="number" step="any" id="montant" name="montant" value={nouveauBeneficiaire.montant} onChange={handleChange} placeholder="Ex: 50000" className="form-input" required min="0" />
           </div>
      </div>

      {/* Row 3: Type Depense, Trimestre (Conditional) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label htmlFor="expenditureType" className="form-label">Type de Dépense <span className="text-red-500">*</span></label>
            <select id="expenditureType" name="expenditureType" value={nouveauBeneficiaire.expenditureType} onChange={handleChange} className="form-select" required>
              <option value="" disabled>-- Sélectionner --</option>
              <option value="bonDeCommande">{getExpenditureTypeDisplayName('bonDeCommande')}</option>
              <option value="carburants">{getExpenditureTypeDisplayName('carburants')}</option>
              <option value="mission">{getExpenditureTypeDisplayName('mission')}</option>
              <option value="emolumentsMagistrats">{getExpenditureTypeDisplayName('emolumentsMagistrats')}</option>
              <option value="emolumentsGreffiers">{getExpenditureTypeDisplayName('emolumentsGreffiers')}</option>
            </select>
          </div>
          {/* Conditional Trimestre Field */}
          {['emolumentsMagistrats', 'emolumentsGreffiers'].includes(nouveauBeneficiaire.expenditureType) && (
              <div className="form-group">
                <label htmlFor="trimestre" className="form-label">Trimestre <span className="text-red-500">*</span></label>
                <select id="trimestre" name="trimestre" value={nouveauBeneficiaire.trimestre} onChange={handleChange} className="form-select" required>
                  <option value="" disabled>-- Sélectionner --</option>
                  <option value="T1">T1</option>
                  <option value="T2">T2</option>
                  <option value="T3">T3</option>
                  <option value="T4">T4</option>
                </select>
              </div>
          )}
      </div>


      {/* --- REMOVED OLD Mode de Paiement selection --- */}

      <div className="pt-4">
        <button type="submit" className="btn btn-secondary btn-lg btn-block">
           {/* ... Add icon unchanged ... */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Ajouter le bénéficiaire
        </button>
      </div>
    </form>

     {/* Preview Section */}
    {(nouveauBeneficiaire.nom || nouveauBeneficiaire.reference || nouveauBeneficiaire.telephone || nouveauBeneficiaire.montant || nouveauBeneficiaire.expenditureType) && (
      <div className="mt-8 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-md font-medium text-blue-800 mb-2">Aperçu du message SMS</h3>
        <p className="text-sm text-blue-700 whitespace-pre-wrap">
           {generatePreviewMessage()}
        </p>
      </div>
     )}
  </div>
);
};


// --- MODIFIED SettingsTab ---
const SettingsTab = ({
  messageTemplates,
  setMessageTemplates,
  showNotification,
  defaultTemplates, // Receive defaults
  getExpenditureTypeDisplayName // Receive helper
}) => {
// Local state to manage form edits before saving
const [formTemplates, setFormTemplates] = React.useState({...messageTemplates});
const [showTemplateHelp, setShowTemplateHelp] = React.useState(false);
// Keep track of which template is being edited if needed (optional)
// const [activeTemplateKey, setActiveTemplateKey] = React.useState('bonDeCommande');

// Update local form state if global templates change (e.g., after reset or initial load)
React.useEffect(() => {
    setFormTemplates(messageTemplates);
}, [messageTemplates]);

// Handle changes in any template textarea
const handleTemplateChange = (e) => {
  const { name, value } = e.target; // name will be "bonDeCommande", "carburants", etc.
  setFormTemplates(prev => ({
    ...prev,
    [name]: value
  }));
};

// Save all templates from local form state to global state and localStorage
const saveSettings = (e) => {
  e.preventDefault();
  setMessageTemplates(formTemplates); // Update the main state
  showNotification('Modèles de message enregistrés avec succès', 'success');
};

// Reset all templates to their default values
const resetAllTemplates = () => {
  if (confirm('Êtes-vous sûr de vouloir réinitialiser TOUS les modèles de message aux valeurs par défaut ?')) {
    setFormTemplates(defaultTemplates); // Reset local form state
    setMessageTemplates(defaultTemplates); // Reset global state immediately
    showNotification('Tous les modèles de message ont été réinitialisés', 'info');
  }
};

// Define the order and keys for templates
const templateKeys = [
    'bonDeCommande',
    'carburants',
    'mission',
    'emolumentsMagistrats',
    'emolumentsGreffiers'
];

return (
  <div>
    <h2 className="text-xl font-semibold mb-4">Paramètres des Modèles SMS</h2>

     <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
         <p className="text-sm text-blue-700">
            Configurez ici les modèles de messages SMS pour chaque type de dépense. L'envoi réel est géré par le serveur backend.
         </p>
     </div>

    <form onSubmit={saveSettings} className="space-y-6"> {/* Increased spacing */}
       {/* Message Template Section */}
       <div className="border-t pt-6">
         <div className="flex justify-between items-center mb-4"> {/* Increased margin */}
           <h3 className="text-lg font-medium text-gray-800">Édition des Modèles</h3>
           <div className="flex items-center space-x-2"> {/* Added space */}
             <button
               type="button"
               onClick={resetAllTemplates}
               className="btn btn-outline text-xs" // Adjusted button style/size
               title="Réinitialiser tous les modèles"
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2a8.001 8.001 0 0015.357 2m0 0H15" /></svg>
               Réinitialiser Tout
             </button>
             <button
               type="button"
               onClick={() => setShowTemplateHelp(!showTemplateHelp)}
               className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-100 rounded"
               title="Aide sur les variables"
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </button>
           </div>
         </div>

         {/* Variable Help Section */}
         {showTemplateHelp && (
           <div className="bg-blue-50 p-3 rounded mb-4 text-sm text-blue-800 border border-blue-200">
             <p className="font-medium mb-1">Variables disponibles (seront remplacées lors de l'envoi):</p>
             <ul className="list-disc list-inside space-y-1 pl-2">
               <li><code className="bg-blue-100 px-1 rounded text-xs">{'{nom}'}</code> - Nom complet du bénéficiaire</li>
               <li><code className="bg-blue-100 px-1 rounded text-xs">{'{reference}'}</code> - Numéro de référence/bon</li>
               <li><code className="bg-blue-100 px-1 rounded text-xs">{'{montant}'}</code> - Montant formaté (ex: 50 000 FCFA)</li>
               <li><code className="bg-blue-100 px-1 rounded text-xs">{'{date programmation}'}</code> - Date de programmation (format JJ/MM/AAAA)</li>
               <li><code className="bg-blue-100 px-1 rounded text-xs">{'{choisir Trimestre}'}</code> - Trimestre sélectionné (T1, T2, T3, T4), si applicable</li>
             </ul>
             <p className="mt-2 italic text-xs">Le modèle "Carburants" n'utilise généralement pas la date ni les détails de caisse.</p>
           </div>
         )}

         {/* --- MODIFIED: Loop through templates --- */}
         <div className="space-y-5"> {/* Spacing between template editors */}
            {templateKeys.map(key => (
                <div key={key}>
                    <label htmlFor={`template-${key}`} className="block text-sm font-medium text-gray-700 mb-1">
                        {getExpenditureTypeDisplayName(key)}
                    </label>
                    <textarea
                        id={`template-${key}`}
                        name={key} // Use the key as the name attribute
                        value={formTemplates[key]} // Bind to the local form state
                        onChange={handleTemplateChange} // Use the unified handler
                        rows={6} // Increased rows
                        className="form-textarea text-sm" // Use form-textarea class
                        placeholder={`Modèle pour ${getExpenditureTypeDisplayName(key)}`}
                    />
                </div>
            ))}
         </div>

         {/* --- REMOVED old template textareas --- */}
       </div>

      {/* Save Button */}
      <div className="pt-4 border-t mt-6"> {/* Added separator */}
        <button
          type="submit"
          className="btn btn-primary"
        >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
          Enregistrer tous les modèles
        </button>
      </div>
    </form>

    {/* About Section */}
    <div className="mt-10 border-t pt-6">
       {/* ... About section unchanged ... */}
       <h3 className="text-lg font-medium mb-3">À propos de cette application</h3>
        <p className="text-sm text-gray-600">
          Cette application permet de gérer une liste de bénéficiaires et de préparer des notifications de paiement par SMS pour différents types de dépenses. L'envoi effectif des SMS est géré par un service backend séparé (Node.js/Twilio). Toutes les données sont stockées localement dans le navigateur.
        </p>
         <p className="text-sm text-gray-600 mt-2">
           Version 2.0.0 (Multi-Template Support)
         </p>
    </div>
  </div>
);
};


// Rendu de l'application
ReactDOM.render(<App />, document.getElementById('app'));