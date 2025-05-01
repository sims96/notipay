// Structure des données pour les bénéficiaires
// {
//   id: string (généré automatiquement),
//   nom: string,
//   telephone: string,
//   reference: string,
//   modePaiement: "especes" | "virement",
//   dateAjout: Date,
//   notifie: boolean
// }

// App Component - Composant principal de l'application
const App = () => {
  const [activeTab, setActiveTab] = React.useState('home');
  const [beneficiaires, setBeneficiaires] = React.useState([]);
  const [dateNotification, setDateNotification] = React.useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = React.useState('');
  // Removed SMS Global specific API keys
  const [apiSettings, setApiSettings] = React.useState({
    messageTemplateEspeces: localStorage.getItem('messageTemplateEspeces') || 'Bonjour M. {nom} votre bon de commande numéro {reference} est programmé pour paiement en numéraire. Bien vouloir vous présenter au service de la comptabilité de la Trésorerie générale de Yaoundé 2. Cordialement',
    messageTemplateVirement: localStorage.getItem('messageTemplateVirement') || 'Bonjour M. {nom}, votre virement No {reference} est disponible dans votre banque. Bien vouloir vous y rendre. Passez une excellente journée.'
  });
  const [notification, setNotification] = React.useState({ show: false, message: '', type: 'success' });
  const [isLoading, setIsLoading] = React.useState(false); // Added loading state

  // --- ADDED: Ref to store the notification timeout ID ---
  const notificationTimeoutRef = React.useRef(null);


  // Chargement des bénéficiaires depuis localStorage au chargement
  React.useEffect(() => {
    const storedBeneficiaires = localStorage.getItem('beneficiaires');
    if (storedBeneficiaires) {
        try {
            const parsedBeneficiaires = JSON.parse(storedBeneficiaires);
            // Ensure it's an array before setting state
            if (Array.isArray(parsedBeneficiaires)) {
                 setBeneficiaires(parsedBeneficiaires);
            } else {
                console.error("Stored beneficiaries is not an array:", parsedBeneficiaires);
                localStorage.removeItem('beneficiaires'); // Clear invalid data
            }
        } catch (error) {
            console.error("Failed to parse stored beneficiaries:", error);
            localStorage.removeItem('beneficiaires'); // Clear invalid data
        }
    }

    const storedDate = localStorage.getItem('dateNotification');
    if (storedDate) {
      setDateNotification(storedDate);
    }
    // Load message templates from localStorage
    const storedTemplateEspeces = localStorage.getItem('messageTemplateEspeces');
    const storedTemplateVirement = localStorage.getItem('messageTemplateVirement');
    setApiSettings(prev => ({
        ...prev,
        messageTemplateEspeces: storedTemplateEspeces || prev.messageTemplateEspeces,
        messageTemplateVirement: storedTemplateVirement || prev.messageTemplateVirement
    }));
  }, []);

  // Sauvegarde des bénéficiaires dans localStorage à chaque modification
  React.useEffect(() => {
    // Only save if beneficiaires is actually an array
    if (Array.isArray(beneficiaires)) {
        localStorage.setItem('beneficiaires', JSON.stringify(beneficiaires));
    }
  }, [beneficiaires]);

  // Sauvegarde de la date de notification dans localStorage
  React.useEffect(() => {
    localStorage.setItem('dateNotification', dateNotification);
  }, [dateNotification]);

  // Sauvegarde des paramètres (message templates only)
  React.useEffect(() => {
    localStorage.setItem('messageTemplateEspeces', apiSettings.messageTemplateEspeces);
    localStorage.setItem('messageTemplateVirement', apiSettings.messageTemplateVirement);
  }, [apiSettings]);

  // Ajout d'un bénéficiaire
  const ajouterBeneficiaire = (nouveauBeneficiaire) => {
    const beneficiaireAvecId = {
      ...nouveauBeneficiaire,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Longer random part
      dateAjout: new Date().toISOString(),
      notifie: false
    };
    // Ensure beneficiaires is an array before spreading
    setBeneficiaires(prev => Array.isArray(prev) ? [...prev, beneficiaireAvecId] : [beneficiaireAvecId]);
    showNotification('Bénéficiaire ajouté avec succès', 'success');
  };

  // Mise à jour d'un bénéficiaire
  const mettreAJourBeneficiaire = (id, donneesModifiees) => {
    setBeneficiaires(prev =>
        Array.isArray(prev)
            ? prev.map(benef => benef.id === id ? { ...benef, ...donneesModifiees } : benef)
            : [] // Reset to empty array if previous state wasn't an array
    );
    showNotification('Bénéficiaire mis à jour avec succès', 'success');
  };

  // Suppression d'un bénéficiaire
  const supprimerBeneficiaire = (id) => {
     setBeneficiaires(prev =>
        Array.isArray(prev)
            ? prev.filter(benef => benef.id !== id)
            : [] // Reset to empty array if previous state wasn't an array
     );
    showNotification('Bénéficiaire supprimé', 'info');
  };

  // Filtrage des bénéficiaires selon la recherche
  const beneficiairesFiltres = Array.isArray(beneficiaires) ? beneficiaires.filter(benef =>
    (benef.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (benef.telephone || '').includes(searchTerm) ||
    (benef.reference?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  ) : []; // Return empty array if beneficiaires is not an array

  // Importation des bénéficiaires depuis un fichier Excel/CSV
  const importerBeneficiaires = (data) => {
    const nouveauxBeneficiaires = data.map(row => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Longer random part
      nom: row.Nom || row.nom || '',
      telephone: String(row.Téléphone || row.Telephone || row.telephone || ''),
      reference: String(row.Référence || row.Reference || row.reference || ''),
      modePaiement: (String(row['Mode de paiement'] || row.ModePaiement || row.modePaiement || '')).toLowerCase().includes('esp') ? 'especes' : 'virement',
      dateAjout: new Date().toISOString(),
      notifie: false
    })).filter(b => b.nom && b.telephone && b.reference); // Basic validation

    if(nouveauxBeneficiaires.length === 0 && data.length > 0) {
        showNotification("Erreur lors de l'importation. Vérifiez les noms des colonnes (Nom, Téléphone, Référence, Mode de paiement) et le format du fichier.", 'error');
        return;
    }
    // Ensure beneficiaires is an array before spreading
    setBeneficiaires(prev => Array.isArray(prev) ? [...prev, ...nouveauxBeneficiaires] : [...nouveauxBeneficiaires]);
    showNotification(`${nouveauxBeneficiaires.length} bénéficiaires importés avec succès`, 'success');
  };

  // Génération du message SMS pour un bénéficiaire
  const genererMessageSMS = (beneficiaire) => {
    let message = beneficiaire.modePaiement === 'especes'
      ? apiSettings.messageTemplateEspeces
      : apiSettings.messageTemplateVirement;

    message = message.replace(/{nom}/g, beneficiaire.nom);
    message = message.replace(/{reference}/g, beneficiaire.reference);
    // Format date nicely for the user (e.g., in French locale)
    try {
        message = message.replace(/{date}/g, new Date(dateNotification).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }));
    } catch(e) {
         message = message.replace(/{date}/g, dateNotification); // Fallback to ISO string if date is invalid
    }

    return message;
  };

  // Envoi des notifications via le backend
  const envoyerNotifications = async (beneficiairesSelectionnesIds) => {
    if (beneficiairesSelectionnesIds.length === 0) {
      showNotification('Veuillez sélectionner au moins un bénéficiaire.', 'warning');
      return;
    }

    // --- CORRECTED: Use the full backend URL ---
    const backendUrl = 'http://localhost:3001/api/send-sms';

    setIsLoading(true);
    showNotification(`Préparation de ${beneficiairesSelectionnesIds.length} notifications...`, 'info');

    // Prepare the payload for the backend
    const currentBeneficiaires = Array.isArray(beneficiaires) ? beneficiaires : []; // Ensure it's an array
    const messagesToSend = currentBeneficiaires
        .filter(benef => beneficiairesSelectionnesIds.includes(benef.id))
        .map(benef => ({
            to: benef.telephone,
            body: genererMessageSMS(benef),
            beneficiaryId: benef.id
        }));

    if (messagesToSend.length === 0) {
        setIsLoading(false);
        showNotification('Aucun message à envoyer pour les bénéficiaires sélectionnés.', 'warning');
        return;
    }

    try {
        // Send data to the backend endpoint
        showNotification('Envoi des notifications en cours via le serveur...', 'info');
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages: messagesToSend }),
        });

        // Handle the response from the backend
        if (!response.ok) {
            let errorMsg = `Erreur serveur: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.message || errorData.error || errorMsg;
            } catch (e) { /* Could not parse JSON error body */ }
            throw new Error(errorMsg);
        }

        const result = await response.json();

        // Process backend result
        let successfulSends = 0;
        let failedSends = 0;
        const updatedBeneficiairesMap = new Map(); // Use a map for efficient updates

        if (result.results && Array.isArray(result.results)) {
             result.results.forEach(sendResult => {
                if (sendResult && sendResult.beneficiaryId) {
                    if (['sent', 'queued', 'delivered', 'accepted', 'scheduled'].includes(sendResult.status)) {
                        successfulSends++;
                        updatedBeneficiairesMap.set(sendResult.beneficiaryId, { notifie: true });
                    } else {
                        failedSends++;
                        console.error(`Failed for ${sendResult.beneficiaryId}: ${sendResult.message || sendResult.status}`);
                        // Don't mark as notified on failure
                        updatedBeneficiairesMap.set(sendResult.beneficiaryId, { notifie: false });
                    }
                }
             });
        } else {
             console.warn("Backend response missing detailed results array.");
             // Optimistically mark selected as notified if no specific failure info from backend
              beneficiairesSelectionnesIds.forEach(id => updatedBeneficiairesMap.set(id, { notifie: true }));
              successfulSends = beneficiairesSelectionnesIds.length; // Assume success if no details provided
        }

        // Update beneficiaires state based on the map
        setBeneficiaires(prev =>
            Array.isArray(prev)
                ? prev.map(benef => updatedBeneficiairesMap.has(benef.id) ? { ...benef, ...updatedBeneficiairesMap.get(benef.id) } : benef)
                : [] // Reset if prev wasn't an array
        );

        // Determine final notification message
        let finalMessage = '';
        let finalType = 'success';

        if (successfulSends > 0 && failedSends === 0) {
            finalMessage = `${successfulSends} notifications envoyées/programmées avec succès.`;
        } else if (successfulSends > 0 && failedSends > 0) {
            finalMessage = `${successfulSends} envoyées/programmées, ${failedSends} échecs. Vérifiez la console du navigateur ou les logs du serveur.`;
            finalType = 'warning';
        } else if (successfulSends === 0 && failedSends > 0) {
            finalMessage = `Échec de l'envoi de ${failedSends} notifications. Vérifiez la console du navigateur ou les logs du serveur.`;
            finalType = 'error';
        } else {
            // General success message if backend response was unclear but fetch succeeded
            finalMessage = result.message || `${beneficiairesSelectionnesIds.length} notifications traitées par le serveur.`;
             // Assume success if fetch ok and no failure details
             if (!result.results && !result.success === false){
                 finalType = 'success';
             } else {
                 finalType = result.success ? 'success' : 'warning';
             }

        }
        showNotification(finalMessage, finalType);

    } catch (error) {
        console.error("Erreur lors de l'envoi des notifications (fetch):", error);
        showNotification(`Erreur de communication avec le serveur: ${error.message}`, 'error');
    } finally {
        setIsLoading(false);
    }
  };


  // --- MODIFIED: showNotification function with timeout clearing ---
  const showNotification = (message, type = 'info') => {
    // Clear any existing timeout before showing a new notification
    if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
        notificationTimeoutRef.current = null;
    }

    setNotification({ show: true, message, type });

    const timeout = (type === 'error' || type === 'warning') ? 5000 : 3000;
    notificationTimeoutRef.current = setTimeout(() => {
        setNotification({ show: false, message: '', type: 'info' });
        notificationTimeoutRef.current = null;
        }, timeout);
  };

  // --- ADDED: Cleanup timeout on component unmount ---
  React.useEffect(() => {
      return () => {
          if (notificationTimeoutRef.current) {
              clearTimeout(notificationTimeoutRef.current);
          }
      };
  }, []);


  // Tout effacer
  const toutEffacer = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer TOUS les bénéficiaires ? Cette action est irréversible.')) {
      setBeneficiaires([]);
      showNotification('Tous les bénéficiaires ont été supprimés', 'info');
      localStorage.removeItem('beneficiaires');
    }
  };

  return (
    <div className="app-container p-4">
      {/* En-tête */}
      <header className="text-white p-6 rounded-lg shadow-md mb-6">
        <h1 className="text-2xl font-bold text-center">Notification des Paiements</h1>
        <p className="text-center text-sm opacity-90 mt-1">Envoyez des SMS aux bénéficiaires pour les informer de leurs paiements</p>
      </header>

      {/* Navigation */}
      <div className="tab-nav flex mb-4 bg-white rounded-lg shadow-sm overflow-x-auto">
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
          Paramètres
        </button>
      </div>

      {/* Notification */}
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
           {isLoading && ( // Show spinner inside notification if loading
                <svg className="loading-spinner h-4 w-4 inline-block ml-2 align-middle" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
           )}
        </div>
      )}

      {/* Contenu principal */}
      <main className="bg-white rounded-lg shadow-md p-4 min-h-[60vh]">
        {activeTab === 'home' && (
          <HomeTab
            beneficiaires={beneficiairesFiltres}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            dateNotification={dateNotification}
            setDateNotification={setDateNotification}
            supprimerBeneficiaire={supprimerBeneficiaire}
            mettreAJourBeneficiaire={mettreAJourBeneficiaire}
            envoyerNotifications={envoyerNotifications}
            genererMessageSMS={genererMessageSMS}
            toutEffacer={toutEffacer}
            isLoading={isLoading}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'import' && (
          <ImportTab importerBeneficiaires={importerBeneficiaires} />
        )}

        {activeTab === 'add' && (
          <AddTab
            ajouterBeneficiaire={ajouterBeneficiaire}
            apiSettings={apiSettings}
            dateNotification={dateNotification}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            apiSettings={apiSettings}
            setApiSettings={setApiSettings}
            showNotification={showNotification}
          />
        )}
      </main>

      {/* Pied de page */}
      <footer className="mt-6 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Notification des Paiements</p>
      </footer>
    </div>
  );
};


// --- HomeTab Component (mostly unchanged logic, pass props down) ---
const HomeTab = ({
  beneficiaires,
  searchTerm,
  setSearchTerm,
  dateNotification,
  setDateNotification,
  supprimerBeneficiaire,
  mettreAJourBeneficiaire,
  envoyerNotifications,
  genererMessageSMS,
  toutEffacer,
  isLoading,
  setActiveTab
}) => {
  const [selectedBeneficiaires, setSelectedBeneficiaires] = React.useState([]);
  const [showPreview, setShowPreview] = React.useState(false);
  const [previewBeneficiaire, setPreviewBeneficiaire] = React.useState(null);
  const [editingBeneficiaire, setEditingBeneficiaire] = React.useState(null);

  // Clear selection when beneficiaries list changes
  React.useEffect(() => {
     setSelectedBeneficiaires([]);
  }, [beneficiaires]);

  // Calculate current beneficiaries length safely
  const currentBeneficiairesLength = Array.isArray(beneficiaires) ? beneficiaires.length : 0;

  const toggleSelection = (id) => {
    setSelectedBeneficiaires(prevSelected =>
        prevSelected.includes(id)
            ? prevSelected.filter(b => b !== id)
            : [...prevSelected, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedBeneficiaires.length === currentBeneficiairesLength) {
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
    setEditingBeneficiaire({...beneficiaire});
  };

  const saveChanges = () => {
    if (editingBeneficiaire) {
      if (!editingBeneficiaire.nom?.trim() || !editingBeneficiaire.telephone?.trim() || !editingBeneficiaire.reference?.trim()) {
        alert("Le nom, le téléphone et la référence ne peuvent pas être vides.");
        return;
      }
      mettreAJourBeneficiaire(editingBeneficiaire.id, editingBeneficiaire);
      setEditingBeneficiaire(null);
    }
  };

  const cancelEditing = () => {
    setEditingBeneficiaire(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingBeneficiaire(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div>
      {/* Date de paiement */}
      <div className="mb-6 date-container flex items-center p-4 rounded-lg">
        <div className="date-icon mr-3 flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-grow min-w-0">
          <label htmlFor="dateNotifInput" className="block text-sm font-medium text-gray-700">Date de programmation</label>
          <input
            id="dateNotifInput"
            type="date"
            value={dateNotification}
            onChange={(e) => setDateNotification(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-sm p-2"
          />
        </div>
        <div className="ml-4 text-sm text-gray-600 hidden md:block flex-shrink-0">
          (Incluse dans les SMS)
        </div>
      </div>

      {/* Recherche et contrôles */}
      <div className="mb-4 flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0 md:space-x-2">
        <div className="w-full md:flex-grow">
          <input
            type="text"
            placeholder="Rechercher (Nom, Téléphone, Réf)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={toggleSelectAll}
            className="btn btn-outline text-xs sm:text-sm"
            disabled={currentBeneficiairesLength === 0 || isLoading}
          >
            {selectedBeneficiaires.length === currentBeneficiairesLength && currentBeneficiairesLength > 0 ? 'Tout Désélec.' : 'Tout Sélec.'}
          </button>
          <button
            onClick={toutEffacer}
            className="btn btn-outline text-xs sm:text-sm"
            disabled={currentBeneficiairesLength === 0 || isLoading}
          >
            Tout Effacer
          </button>
        </div>
      </div>

      {/* Liste des bénéficiaires */}
      <div className="beneficiary-list-container overflow-y-auto border rounded-lg" style={{ maxHeight: '50vh' }}>
        <h3 className="text-base font-medium mb-0 sticky top-0 bg-gray-50 p-3 border-b z-10">
            Liste des bénéficiaires ({currentBeneficiairesLength})
            {selectedBeneficiaires.length > 0 && ` - ${selectedBeneficiaires.length} sélectionné(s)`}
        </h3>

        {currentBeneficiairesLength === 0 ? (
          <div className="text-center p-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="mt-2 text-gray-600">Aucun bénéficiaire ajouté</p>
            <p className="text-sm text-gray-500 mt-1">Commencez par importer un fichier ou ajouter manuellement</p>
          </div>
        ) : (
          <div className="space-y-0"> {/* Remove space-y for border-b approach */}
            {beneficiaires.map((beneficiaire, index) => (
              <div key={beneficiaire.id || index} /* Fallback key */ className={`beneficiary-card p-3 md:p-4 ${index < beneficiaires.length - 1 ? 'border-b' : ''} ${selectedBeneficiaires.includes(beneficiaire.id) ? 'selected' : ''} ${beneficiaire.notifie ? 'opacity-70 bg-green-50' : 'bg-white hover:bg-gray-50'}`}>
                 {editingBeneficiaire && editingBeneficiaire.id === beneficiaire.id ? (
                   // Mode édition
                   <div className="space-y-2">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       <div>
                         <label className="block text-xs font-medium text-gray-700">Nom</label>
                         <input type="text" name="nom" value={editingBeneficiaire.nom} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-sm p-2" />
                       </div>
                       <div>
                         <label className="block text-xs font-medium text-gray-700">Téléphone</label>
                         <input type="tel" name="telephone" value={editingBeneficiaire.telephone} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-sm p-2" />
                       </div>
                       <div>
                         <label className="block text-xs font-medium text-gray-700">Référence</label>
                         <input type="text" name="reference" value={editingBeneficiaire.reference} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-sm p-2" />
                       </div>
                       <div>
                         <label className="block text-xs font-medium text-gray-700">Mode Paiement</label>
                         <select name="modePaiement" value={editingBeneficiaire.modePaiement} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-sm p-2">
                           <option value="especes">Espèces</option>
                           <option value="virement">Virement</option>
                         </select>
                       </div>
                     </div>
                     <div className="flex justify-end space-x-2 mt-3">
                       <button onClick={cancelEditing} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm">Annuler</button>
                       <button onClick={saveChanges} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Enregistrer</button>
                     </div>
                   </div>
                 ) : (
                   // Mode affichage
                   <div className="flex flex-col sm:flex-row justify-between items-start">
                     <div className="flex items-start mb-2 sm:mb-0 flex-grow min-w-0 mr-2"> {/* Added min-w-0 mr-2 */}
                       <input
                         type="checkbox"
                         checked={selectedBeneficiaires.includes(beneficiaire.id)}
                         onChange={() => toggleSelection(beneficiaire.id)}
                         disabled={isLoading}
                         className="mt-1 mr-3 h-5 w-5 cursor-pointer accent-primary flex-shrink-0"
                       />
                       <div className="flex-grow min-w-0"> {/* Added min-w-0 */}
                         <h4 className="font-medium text-sm md:text-base break-words">{beneficiaire.nom}</h4>
                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-4 gap-y-1 text-xs md:text-sm text-gray-600 mt-1">
                           <span className="flex items-center truncate" title={beneficiaire.telephone}>
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                              {beneficiaire.telephone}
                           </span>
                           <span className="flex items-center truncate" title={beneficiaire.reference}>
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                             Réf: {beneficiaire.reference}
                           </span>
                           <span className="flex items-center capitalize">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                             {beneficiaire.modePaiement === 'especes' ? 'Espèces' : 'Virement'}
                           </span>
                         </div>
                         {beneficiaire.notifie && (
                           <span className="inline-block mt-1 px-2 py-0.5 badge badge-success text-xs">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                             Notifié
                           </span>
                         )}
                       </div>
                     </div>
                     {/* Action buttons */}
                     <div className="flex mt-2 sm:mt-0 space-x-1 flex-shrink-0 self-start sm:self-center">
                        <button onClick={() => previewMessage(beneficiaire)} disabled={isLoading} className="p-1 text-blue-600 hover:bg-blue-100 rounded disabled:opacity-50 disabled:cursor-not-allowed" title="Prévisualiser SMS">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button onClick={() => startEditing(beneficiaire)} disabled={isLoading} className="p-1 text-amber-600 hover:bg-amber-100 rounded disabled:opacity-50 disabled:cursor-not-allowed" title="Modifier">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => { if (confirm(`Supprimer ${beneficiaire.nom} ?`)) supprimerBeneficiaire(beneficiaire.id);}} disabled={isLoading} className="p-1 text-red-600 hover:bg-red-100 rounded disabled:opacity-50 disabled:cursor-not-allowed" title="Supprimer">
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
        <button
          onClick={() => envoyerNotifications(selectedBeneficiaires)}
          disabled={selectedBeneficiaires.length === 0 || isLoading}
          className={`btn btn-lg btn-block ${isLoading ? 'btn-outline cursor-wait' : (selectedBeneficiaires.length === 0 ? 'btn-outline' : 'btn-success pushed')}`}
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

      {/* Modal de prévisualisation */}
      {showPreview && previewBeneficiaire && (
        <div className="modal-overlay" onClick={closePreview}> {/* Close on overlay click */}
          <div className="modal-container" onClick={(e) => e.stopPropagation()}> {/* Prevent closing when clicking inside modal */}
            <div className="modal-header">
              <h3 className="modal-title">Prévisualisation du message</h3>
              <button onClick={closePreview} className="modal-close">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <p className="text-gray-800 whitespace-pre-wrap break-words">{genererMessageSMS(previewBeneficiaire)}</p>
              </div>
              <div className="text-sm text-gray-600 border-t pt-3">
                <p><strong>Destinataire:</strong> {previewBeneficiaire.telephone}</p>
                <p className="mt-1"><strong>Bénéficiaire:</strong> {previewBeneficiaire.nom}</p>
                 <p className="mt-1"><strong>Référence:</strong> {previewBeneficiaire.reference}</p>
                 <p className="mt-1"><strong>Mode Paiement:</strong> {previewBeneficiaire.modePaiement === 'especes' ? 'Espèces' : 'Virement'}</p>
                <p className="mt-1"><strong>Date Programmation:</strong> {new Date(dateNotification).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
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
                Éditer le modèle
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


// --- ImportTab Component (added validation, more preview) ---
const ImportTab = ({ importerBeneficiaires }) => {
  const [dragActive, setDragActive] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processedData, setProcessedData] = React.useState(null);
  const fileInputRef = React.useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
      e.target.value = null; // Reset file input
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const processFile = (file) => {
    setIsProcessing(true);
    setProcessedData(null);

    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isValidExtension = ['xlsx', 'xls', 'csv'].includes(fileExtension);

    if (!validTypes.includes(file.type) && !isValidExtension) { // Check extension as fallback
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
        if (!firstSheet) throw new Error("Aucune feuille trouvée dans le fichier Excel.");
        const worksheet = workbook.Sheets[firstSheet];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" }); // Use defval to avoid null/undefined

        if (!jsonData || jsonData.length === 0) {
             throw new Error("Le fichier est vide ou n'a pas pu être lu.");
        }

        const headers = Object.keys(jsonData[0]);
        const lowerCaseHeaders = headers.map(h => h.toLowerCase().trim().replace(/\s+/g, '')); // Normalize headers
        const requiredHeaders = ['nom', 'telephone', 'téléphone', 'reference', 'référence'];
        const hasRequiredHeaders = requiredHeaders.some(reqHeader => lowerCaseHeaders.includes(reqHeader.replace('é', 'e'))); // Normalize check too

        if (!hasRequiredHeaders) {
             throw new Error("En-têtes manquants ou incorrects. Assurez-vous d'avoir au moins les colonnes 'Nom', 'Téléphone' (ou 'Telephone'), 'Référence' (ou 'Reference').");
        }

        setProcessedData({
          fileName: file.name,
          rowCount: jsonData.length,
          headers: headers,
          data: jsonData,
          preview: jsonData.slice(0, 5)
        });
      } catch (error) {
        console.error("Erreur lors du traitement du fichier:", error);
        alert(`Erreur lors du traitement du fichier: ${error.message}`);
        setProcessedData(null);
      } finally {
        setIsProcessing(false);
      }
    };
     reader.onerror = (e) => {
        console.error("Erreur de lecture du fichier:", e);
        alert("Une erreur s'est produite lors de la lecture du fichier.");
        setIsProcessing(false);
     };
    reader.readAsArrayBuffer(file);
  };

  const confirmerImport = () => {
    if (processedData && processedData.data) {
      importerBeneficiaires(processedData.data);
      setProcessedData(null);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Importation depuis Excel/CSV</h2>
      <form
        className={`file-upload-area ${dragActive ? 'drag-over' : ''}`}
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        onSubmit={(e) => e.preventDefault()}
      >
        <input ref={fileInputRef} type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
        <div className="upload-icon mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
        </div>
        <p className="text-gray-700 mb-2">Glissez-déposez votre fichier ici, ou</p>
        <button type="button" onClick={onButtonClick} className="btn btn-primary" disabled={isProcessing}>Sélectionner un fichier</button>
        <p className="text-sm text-gray-500 mt-4">
          Formats supportés: .xlsx, .xls, .csv<br />
          Colonnes requises: <strong>Nom, Téléphone, Référence</strong><br/>
          Colonne optionnelle: Mode de paiement (Espèces/Virement)
        </p>
      </form>

      {isProcessing && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center justify-center">
          <svg className="loading-spinner h-5 w-5 mr-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <span>Traitement du fichier en cours...</span>
        </div>
      )}

      {processedData && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Aperçu de l'importation</h3>
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{processedData.rowCount} lignes détectées</span>
          </div>
          <p className="text-sm text-gray-600 mb-2">Fichier: <span className="font-medium">{processedData.fileName}</span></p>
          <div className="mt-3 overflow-x-auto">
             <table className="min-w-full border border-gray-300 rounded text-xs">
              <thead className="bg-gray-100">
                <tr>
                  {processedData.headers.map((header, index) => (
                    <th key={index} className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider border-b">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedData.preview.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {processedData.headers.map((header, colIndex) => (
                      <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-gray-700">{String(row[header] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {processedData.rowCount > processedData.preview.length && (
            <p className="text-sm text-gray-500 mt-2 italic">... et {processedData.rowCount - processedData.preview.length} autres lignes</p>
          )}
          <div className="mt-4 flex justify-end space-x-3">
            <button onClick={() => setProcessedData(null)} className="btn btn-outline">Annuler</button>
            <button onClick={confirmerImport} className="btn btn-primary">Confirmer et Importer</button>
          </div>
        </div>
      )}
    </div>
  );
};


// --- AddTab Component (added hint for phone format) ---
const AddTab = ({ ajouterBeneficiaire, apiSettings, dateNotification }) => {
  const [nouveauBeneficiaire, setNouveauBeneficiaire] = React.useState({
    nom: '',
    telephone: '',
    reference: '',
    modePaiement: 'especes'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNouveauBeneficiaire(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nouveauBeneficiaire.nom.trim() || !nouveauBeneficiaire.telephone.trim() || !nouveauBeneficiaire.reference.trim()) {
      alert("Veuillez remplir tous les champs obligatoires (Nom, Téléphone, Référence).");
      return;
    }
    // Simple check for plus sign, more robust validation could be added
     if (!nouveauBeneficiaire.telephone.startsWith('+')) {
         if (!confirm("Le numéro de téléphone ne commence pas par '+'. Format international (ex: +237...) est recommandé. Continuer quand même ?")) {
             return;
         }
     }
    ajouterBeneficiaire(nouveauBeneficiaire);
    setNouveauBeneficiaire({ nom: '', telephone: '', reference: '', modePaiement: 'especes' });
  };

   const generatePreviewMessage = () => {
      let message = nouveauBeneficiaire.modePaiement === 'especes'
        ? apiSettings.messageTemplateEspeces
        : apiSettings.messageTemplateVirement;
      message = message.replace(/{nom}/g, nouveauBeneficiaire.nom.trim() || '[NOM]');
      message = message.replace(/{reference}/g, nouveauBeneficiaire.reference.trim() || '[RÉFÉRENCE]');
      try {
        message = message.replace(/{date}/g, new Date(dateNotification).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }));
      } catch(e){
         message = message.replace(/{date}/g, dateNotification);
      }
      return message;
   };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Ajout manuel d'un bénéficiaire</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label htmlFor="add-nom" className="form-label">Nom <span className="text-red-500">*</span></label>
          <input type="text" id="add-nom" name="nom" value={nouveauBeneficiaire.nom} onChange={handleChange} placeholder="Nom complet" className="form-input" required />
        </div>
        <div className="form-group">
          <label htmlFor="add-telephone" className="form-label">Téléphone <span className="text-red-500">*</span></label>
          <input type="tel" id="add-telephone" name="telephone" value={nouveauBeneficiaire.telephone} onChange={handleChange} placeholder="Numéro de téléphone (ex: +237...)" className="form-input" required />
          <p className="form-hint">Format international (E.164) requis par Twilio (ex: +237XXXXXXXXX)</p>
        </div>
        <div className="form-group">
          <label htmlFor="add-reference" className="form-label">Référence <span className="text-red-500">*</span></label>
          <input type="text" id="add-reference" name="reference" value={nouveauBeneficiaire.reference} onChange={handleChange} placeholder="Référence du paiement" className="form-input" required />
        </div>
        <div className="form-group">
          <label className="form-label">Mode de paiement</label>
          <div className="mt-1 grid grid-cols-2 gap-3">
            <div className={`payment-method-card cursor-pointer ${nouveauBeneficiaire.modePaiement === 'especes' ? 'selected' : ''}`} onClick={() => setNouveauBeneficiaire({...nouveauBeneficiaire, modePaiement: 'especes'})} role="radio" aria-checked={nouveauBeneficiaire.modePaiement === 'especes'} tabIndex="0" onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setNouveauBeneficiaire({...nouveauBeneficiaire, modePaiement: 'especes'}); }}>
              <div className="icon"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>
              <span>Espèces</span>
            </div>
            <div className={`payment-method-card cursor-pointer ${nouveauBeneficiaire.modePaiement === 'virement' ? 'selected' : ''}`} onClick={() => setNouveauBeneficiaire({...nouveauBeneficiaire, modePaiement: 'virement'})} role="radio" aria-checked={nouveauBeneficiaire.modePaiement === 'virement'} tabIndex="0" onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setNouveauBeneficiaire({...nouveauBeneficiaire, modePaiement: 'virement'}); }}>
              <div className="icon"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg></div>
              <span>Virement</span>
            </div>
          </div>
        </div>
        <div className="pt-4">
          <button type="submit" className="btn btn-secondary btn-lg btn-block">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            Ajouter le bénéficiaire
          </button>
        </div>
      </form>
       {(nouveauBeneficiaire.nom || nouveauBeneficiaire.reference || nouveauBeneficiaire.telephone) && (
        <div className="mt-8 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-md font-medium text-blue-800 mb-2">Aperçu du message SMS</h3>
          <p className="text-sm text-blue-700 whitespace-pre-wrap break-words">{generatePreviewMessage()}</p>
        </div>
       )}
    </div>
  );
};


// --- SettingsTab Component (removed API fields, kept templates) ---
const SettingsTab = ({ apiSettings, setApiSettings, showNotification }) => {
  const [formSettings, setFormSettings] = React.useState({...apiSettings});
  const [showTemplateHelp, setShowTemplateHelp] = React.useState(false);
  const [activeTemplateTab, setActiveTemplateTab] = React.useState('especes');

  React.useEffect(() => { setFormSettings(apiSettings); }, [apiSettings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormSettings(prev => ({ ...prev, [name]: value }));
  };

  const saveSettings = (e) => {
    e.preventDefault();
    setApiSettings(prev => ({
        ...prev,
        messageTemplateEspeces: formSettings.messageTemplateEspeces,
        messageTemplateVirement: formSettings.messageTemplateVirement
    }));
    showNotification('Modèles de message enregistrés avec succès', 'success');
  };

  const resetMessageTemplate = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser les modèles de message aux valeurs par défaut ?')) {
      const defaultTemplateEspeces = 'Bonjour M. {nom} votre bon de commande numéro {reference} est programmé pour paiement en numéraire. Bien vouloir vous présenter au service de la comptabilité de la Trésorerie générale de Yaoundé 2. Cordialement';
      const defaultTemplateVirement = 'Bonjour M. {nom}, votre virement No {reference} est disponible dans votre banque. Bien vouloir vous y rendre. Passez une excellente journée.';
      const newSettings = {
        messageTemplateEspeces: defaultTemplateEspeces,
        messageTemplateVirement: defaultTemplateVirement
      };
      setFormSettings(prev => ({ ...prev, ...newSettings }));
      setApiSettings(prev => ({ ...prev, ...newSettings }));
      showNotification('Modèles de message réinitialisés', 'info');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Paramètres</h2>
       <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
           <p className="text-sm text-blue-700">
              Configurez ici les modèles de messages SMS qui seront envoyés. L'envoi réel des SMS est géré par un service backend séparé.
           </p>
       </div>
      <form onSubmit={saveSettings} className="space-y-4">
         <div className="mt-6 border-t pt-6">
           <div className="flex justify-between items-center mb-2">
             <label className="block text-sm font-medium text-gray-700">Modèles de message SMS</label>
             <div className="flex items-center space-x-2">
               <button type="button" onClick={resetMessageTemplate} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded" title="Réinitialiser les modèles">Réinitialiser</button>
               <button type="button" onClick={() => setShowTemplateHelp(!showTemplateHelp)} className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-100 rounded" title="Aide sur les variables">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </button>
             </div>
           </div>
           {showTemplateHelp && (
             <div className="bg-blue-50 p-3 rounded mb-4 text-sm text-blue-800 border border-blue-200">
               <p className="font-medium mb-1">Variables disponibles:</p>
               <ul className="list-disc list-inside space-y-1 pl-2">
                 <li><code className="bg-blue-100 px-1 rounded text-xs">{'{nom}'}</code> - Nom du bénéficiaire</li>
                 <li><code className="bg-blue-100 px-1 rounded text-xs">{'{reference}'}</code> - Numéro de référence</li>
                 <li><code className="bg-blue-100 px-1 rounded text-xs">{'{date}'}</code> - Date de programmation (JJ/MM/AAAA)</li>
               </ul>
             </div>
           )}
           <div className="flex border-b mb-4">
             <button type="button" className={`py-2 px-4 text-sm ${activeTemplateTab === 'especes' ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-gray-600 hover:text-blue-500'}`} onClick={() => setActiveTemplateTab('especes')}>Paiement en Numéraire</button>
             <button type="button" className={`py-2 px-4 text-sm ${activeTemplateTab === 'virement' ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-gray-600 hover:text-blue-500'}`} onClick={() => setActiveTemplateTab('virement')}>Paiement par Virement</button>
           </div>
           {activeTemplateTab === 'especes' && (
             <div>
               <label htmlFor="messageTemplateEspeces" className="block text-sm font-medium text-gray-700 mb-1">Message pour paiement en numéraire</label>
               <textarea id="messageTemplateEspeces" name="messageTemplateEspeces" value={formSettings.messageTemplateEspeces} onChange={handleChange} rows={5} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-sm" placeholder="Modèle de message pour paiement en numéraire" />
             </div>
           )}
           {activeTemplateTab === 'virement' && (
             <div>
               <label htmlFor="messageTemplateVirement" className="block text-sm font-medium text-gray-700 mb-1">Message pour paiement par virement</label>
               <textarea id="messageTemplateVirement" name="messageTemplateVirement" value={formSettings.messageTemplateVirement} onChange={handleChange} rows={5} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 text-sm" placeholder="Modèle de message pour paiement par virement" />
             </div>
           )}
           <p className="mt-2 text-xs text-gray-500">Utilisez les variables entre accolades pour personnaliser le message.</p>
         </div>
        <div className="pt-4">
          <button type="submit" className="btn btn-primary">Enregistrer les modèles</button>
        </div>
      </form>
      <div className="mt-10 border-t pt-6">
        <h3 className="text-lg font-medium mb-3">À propos de cette application</h3>
        <p className="text-sm text-gray-600">
          Cette application permet de gérer une liste de bénéficiaires et de préparer des notifications de paiement par SMS. L'envoi effectif des SMS est géré par un service backend séparé. Les données sont stockées localement sur votre appareil.
        </p>
         <p className="text-sm text-gray-600 mt-2">Version 1.2.0 (Frontend Refined)</p>
      </div>
    </div>
  );
};


// Rendu de l'application
ReactDOM.render(<App />, document.getElementById('app'));