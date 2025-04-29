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
    const [apiSettings, setApiSettings] = React.useState({
      apiKey: localStorage.getItem('smsGlobalApiKey') || '',
      secretKey: localStorage.getItem('smsGlobalSecretKey') || '',
      senderName: localStorage.getItem('smsGlobalSenderName') || 'Trésorerie',
      messageTemplate: localStorage.getItem('messageTemplate') || 'Bonjour M. {nom} votre bon de commande numéro {reference} est programmé pour paiement en {modePaiement}. Bien vouloir vous présenter au service de la comptabilité de la Trésorerie générale de Yaoundé 2. Cordialement'
    });
    const [notification, setNotification] = React.useState({ show: false, message: '', type: 'success' });
  
    // Chargement des bénéficiaires depuis localStorage au chargement
    React.useEffect(() => {
      const storedBeneficiaires = localStorage.getItem('beneficiaires');
      if (storedBeneficiaires) {
        setBeneficiaires(JSON.parse(storedBeneficiaires));
      }
  
      const storedDate = localStorage.getItem('dateNotification');
      if (storedDate) {
        setDateNotification(storedDate);
      }
    }, []);
  
    // Sauvegarde des bénéficiaires dans localStorage à chaque modification
    React.useEffect(() => {
      localStorage.setItem('beneficiaires', JSON.stringify(beneficiaires));
    }, [beneficiaires]);
  
    // Sauvegarde de la date de notification dans localStorage
    React.useEffect(() => {
      localStorage.setItem('dateNotification', dateNotification);
    }, [dateNotification]);
  
    // Sauvegarde des paramètres API
    React.useEffect(() => {
      localStorage.setItem('smsGlobalApiKey', apiSettings.apiKey);
      localStorage.setItem('smsGlobalSecretKey', apiSettings.secretKey);
      localStorage.setItem('smsGlobalSenderName', apiSettings.senderName);
      localStorage.setItem('messageTemplate', apiSettings.messageTemplate);
    }, [apiSettings]);
  
    // Ajout d'un bénéficiaire
    const ajouterBeneficiaire = (nouveauBeneficiaire) => {
      const beneficiaireAvecId = {
        ...nouveauBeneficiaire,
        id: Date.now().toString(),
        dateAjout: new Date().toISOString(),
        notifie: false
      };
      
      setBeneficiaires([...beneficiaires, beneficiaireAvecId]);
      showNotification('Bénéficiaire ajouté avec succès', 'success');
    };
  
    // Mise à jour d'un bénéficiaire
    const mettreAJourBeneficiaire = (id, donneesModifiees) => {
      const nouveauxBeneficiaires = beneficiaires.map(benef => 
        benef.id === id ? { ...benef, ...donneesModifiees } : benef
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
  
    // Filtrage des bénéficiaires selon la recherche
    const beneficiairesFiltres = beneficiaires.filter(benef => 
      benef.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      benef.telephone.includes(searchTerm) ||
      benef.reference.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
    // Importation des bénéficiaires depuis un fichier Excel/CSV
    const importerBeneficiaires = (data) => {
      const nouveauxBeneficiaires = data.map(row => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        nom: row.Nom || row.nom || '',
        telephone: row.Téléphone || row.Telephone || row.telephone || '',
        reference: row.Référence || row.Reference || row.reference || '',
        modePaiement: (row['Mode de paiement'] || row.ModePaiement || row.modePaiement || '').toLowerCase().includes('esp') ? 'especes' : 'virement',
        dateAjout: new Date().toISOString(),
        notifie: false
      }));
      
      setBeneficiaires([...beneficiaires, ...nouveauxBeneficiaires]);
      showNotification(`${nouveauxBeneficiaires.length} bénéficiaires importés avec succès`, 'success');
    };
  
    // Génération du message SMS pour un bénéficiaire
    const genererMessageSMS = (beneficiaire) => {
      // Remplacer les placeholders dans le template
      let message = apiSettings.messageTemplate;
      
      // Remplacer {nom} par le nom du bénéficiaire
      message = message.replace(/{nom}/g, beneficiaire.nom);
      
      // Remplacer {reference} par la référence
      message = message.replace(/{reference}/g, beneficiaire.reference);
      
      // Remplacer {modePaiement} par le mode de paiement formaté
      const modePaiementFormate = beneficiaire.modePaiement === 'especes' ? 'numéraire' : 'virement bancaire';
      message = message.replace(/{modePaiement}/g, modePaiementFormate);
      
      // Remplacer {date} par la date de paiement
      message = message.replace(/{date}/g, dateNotification);
      
      return message;
    };
  
    // Envoi des notifications SMS
    const envoyerNotifications = async (beneficiairesSelectionnes) => {
      if (!apiSettings.apiKey || !apiSettings.secretKey) {
        showNotification('Veuillez configurer vos identifiants API SMS Global', 'error');
        return;
      }
  
      // Simulation d'envoi (à remplacer par l'appel à l'API SMS Global)
      showNotification('Envoi des notifications en cours...', 'info');
      
      // Pour la démo, on simule un envoi avec un délai
      await new Promise(resolve => setTimeout(resolve, 1500));
  
      // Mettre à jour le statut des bénéficiaires
      const nouveauxBeneficiaires = beneficiaires.map(benef => 
        beneficiairesSelectionnes.includes(benef.id) ? { ...benef, notifie: true } : benef
      );
      
      setBeneficiaires(nouveauxBeneficiaires);
      showNotification(`${beneficiairesSelectionnes.length} notifications envoyées avec succès`, 'success');
    };
  
    // Affichage d'une notification
    const showNotification = (message, type = 'info') => {
      setNotification({ show: true, message, type });
      setTimeout(() => setNotification({ show: false, message: '', type: 'info' }), 3000);
    };
  
    // Tout effacer
    const toutEffacer = () => {
      if (confirm('Êtes-vous sûr de vouloir supprimer tous les bénéficiaires ?')) {
        setBeneficiaires([]);
        showNotification('Tous les bénéficiaires ont été supprimés', 'info');
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
            className={`px-4 py-2 flex-1 ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}>
            Accueil
          </button>
          <button 
            className={`px-4 py-2 flex-1 ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}>
            Importer
          </button>
          <button 
            className={`px-4 py-2 flex-1 ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}>
            Ajouter
          </button>
          <button 
            className={`px-4 py-2 flex-1 ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}>
            Paramètres
          </button>
        </div>
  
        {/* Notification */}
        {notification.show && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
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
              mettreAJourBeneficiaire={mettreAJourBeneficiaire}
              envoyerNotifications={envoyerNotifications}
              genererMessageSMS={genererMessageSMS}
              toutEffacer={toutEffacer}
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
  
  // Onglet Accueil
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
    toutEffacer
  }) => {
    const [selectedBeneficiaires, setSelectedBeneficiaires] = React.useState([]);
    const [showPreview, setShowPreview] = React.useState(false);
    const [previewBeneficiaire, setPreviewBeneficiaire] = React.useState(null);
    const [editingBeneficiaire, setEditingBeneficiaire] = React.useState(null);
  
    // Sélection/désélection d'un bénéficiaire
    const toggleSelection = (id) => {
      if (selectedBeneficiaires.includes(id)) {
        setSelectedBeneficiaires(selectedBeneficiaires.filter(b => b !== id));
      } else {
        setSelectedBeneficiaires([...selectedBeneficiaires, id]);
      }
    };
  
    // Sélectionner/désélectionner tous
    const toggleSelectAll = () => {
      if (selectedBeneficiaires.length === beneficiaires.length) {
        setSelectedBeneficiaires([]);
      } else {
        setSelectedBeneficiaires(beneficiaires.map(b => b.id));
      }
    };
  
    // Prévisualiser un message
    const previewMessage = (beneficiaire) => {
      setPreviewBeneficiaire(beneficiaire);
      setShowPreview(true);
    };
  
    // Fermer la prévisualisation
    const closePreview = () => {
      setShowPreview(false);
      setPreviewBeneficiaire(null);
    };
  
    // Commencer l'édition
    const startEditing = (beneficiaire) => {
      setEditingBeneficiaire({...beneficiaire});
    };
  
    // Sauvegarder les modifications
    const saveChanges = () => {
      if (editingBeneficiaire) {
        mettreAJourBeneficiaire(editingBeneficiaire.id, editingBeneficiaire);
        setEditingBeneficiaire(null);
      }
    };
  
    // Annuler l'édition
    const cancelEditing = () => {
      setEditingBeneficiaire(null);
    };
  
    // Gérer les changements dans le formulaire d'édition
    const handleEditChange = (e) => {
      const { name, value } = e.target;
      setEditingBeneficiaire({
        ...editingBeneficiaire,
        [name]: value
      });
    };
  
    return (
      <div>
        {/* Date de paiement */}
        <div className="mb-6 date-container flex items-center p-4 rounded-lg">
          <div className="date-icon mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700">Date de programmation</label>
            <input 
              type="date" 
              value={dateNotification} 
              onChange={(e) => setDateNotification(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            />
          </div>
          <div className="ml-4 text-sm text-gray-600 hidden md:block">
            Les notifications incluront cette date
          </div>
        </div>
  
        {/* Recherche et contrôles */}
        <div className="mb-4 flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
          <div className="w-full md:w-1/2">
            <input
              type="text"
              placeholder="Rechercher un bénéficiaire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleSelectAll}
              className="btn btn-outline"
            >
              {selectedBeneficiaires.length === beneficiaires.length ? 'Désélectionner tout' : 'Sélectionner tout'}
            </button>
            <button 
              onClick={toutEffacer}
              className="btn btn-outline" 
              disabled={beneficiaires.length === 0}
            >
              Tout effacer
            </button>
          </div>
        </div>
  
        {/* Liste des bénéficiaires */}
        <div className="overflow-hidden">
          <h3 className="text-lg font-medium mb-2">Liste des bénéficiaires ({beneficiaires.length})</h3>
          
          {beneficiaires.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="mt-2 text-gray-600">Aucun bénéficiaire ajouté</p>
              <p className="text-sm text-gray-500 mt-1">Commencez par importer un fichier ou ajouter manuellement des bénéficiaires</p>
            </div>
          ) : (
            <div className="space-y-3">
              {beneficiaires.map(beneficiaire => (
                <div key={beneficiaire.id} className={`beneficiary-card p-4 rounded-lg border ${selectedBeneficiaires.includes(beneficiaire.id) ? 'selected' : ''}`}>
                  {editingBeneficiaire && editingBeneficiaire.id === beneficiaire.id ? (
                    // Mode édition
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Nom</label>
                          <input
                            type="text"
                            name="nom"
                            value={editingBeneficiaire.nom}
                            onChange={handleEditChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                          <input
                            type="text"
                            name="telephone"
                            value={editingBeneficiaire.telephone}
                            onChange={handleEditChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Référence</label>
                          <input
                            type="text"
                            name="reference"
                            value={editingBeneficiaire.reference}
                            onChange={handleEditChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Mode de paiement</label>
                          <select
                            name="modePaiement"
                            value={editingBeneficiaire.modePaiement}
                            onChange={handleEditChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                          >
                            <option value="especes">Espèces</option>
                            <option value="virement">Virement</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 mt-3">
                        <button 
                          onClick={cancelEditing}
                          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                        >
                          Annuler
                        </button>
                        <button 
                          onClick={saveChanges}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                        >
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Mode affichage
                    <div className="flex flex-col md:flex-row justify-between">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedBeneficiaires.includes(beneficiaire.id)}
                          onChange={() => toggleSelection(beneficiaire.id)}
                          className="mt-1 mr-3"
                        />
                        <div>
                          <h4 className="font-medium">{beneficiaire.nom}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mt-1">
                            <span>{beneficiaire.telephone}</span>
                            <span>Réf: {beneficiaire.reference}</span>
                            <span className="capitalize">{beneficiaire.modePaiement === 'especes' ? 'Espèces' : 'Virement'}</span>
                          </div>
                          {beneficiaire.notifie && (
                            <span className="inline-block mt-1 px-2 py-0.5 badge badge-success">
                              Notifié
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex mt-2 md:mt-0 space-x-1">
                        <button 
                          onClick={() => previewMessage(beneficiaire)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Prévisualiser"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => startEditing(beneficiaire)}
                          className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                          title="Modifier"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => supprimerBeneficiaire(beneficiaire.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Supprimer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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
            disabled={selectedBeneficiaires.length === 0}
            className={`btn btn-lg btn-block ${
              selectedBeneficiaires.length === 0 
                ? 'btn-outline' 
                : 'btn-success pushed'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Envoyer les notifications ({selectedBeneficiaires.length})
          </button>
        </div>
  
        {/* Modal de prévisualisation */}
        {showPreview && previewBeneficiaire && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h3 className="modal-title">Prévisualisation du message</h3>
                <button onClick={closePreview} className="modal-close">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="modal-body">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-gray-800 whitespace-pre-wrap">{genererMessageSMS(previewBeneficiaire)}</p>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p>Destinataire: {previewBeneficiaire.telephone}</p>
                  <p className="mt-1">Date de programmation: {dateNotification}</p>
                </div>
                <div className="mt-4 text-sm text-gray-700">
                  <p className="font-medium mb-1">Éditer ce message:</p>
                  <div className="flex items-center text-xs text-blue-600 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Vous pouvez modifier le modèle dans l'onglet Paramètres</span>
                  </div>
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
  
  // Onglet Import
  const ImportTab = ({ importerBeneficiaires }) => {
    const [dragActive, setDragActive] = React.useState(false);
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [processedData, setProcessedData] = React.useState(null);
    const fileInputRef = React.useRef(null);
  
    // Gestion du drag and drop
    const handleDrag = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    };
  
    // Traitement du fichier déposé
    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processFile(e.dataTransfer.files[0]);
      }
    };
  
    // Traitement du fichier sélectionné
    const handleFileChange = (e) => {
      if (e.target.files && e.target.files[0]) {
        processFile(e.target.files[0]);
      }
    };
  
    // Déclenchement du sélecteur de fichier
    const onButtonClick = () => {
      fileInputRef.current.click();
    };
  
    // Traitement du fichier Excel/CSV
    const processFile = (file) => {
      setIsProcessing(true);
      setProcessedData(null);
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          setProcessedData({
            fileName: file.name,
            rowCount: jsonData.length,
            headers: Object.keys(jsonData[0] || {}),
            data: jsonData,
            preview: jsonData.slice(0, 3)
          });
        } catch (error) {
          console.error("Erreur lors du traitement du fichier:", error);
          alert("Erreur lors du traitement du fichier. Assurez-vous qu'il s'agit d'un fichier Excel (.xlsx, .xls) ou CSV valide.");
        } finally {
          setIsProcessing(false);
        }
      };
      
      reader.readAsArrayBuffer(file);
    };
  
    // Importation des données
    const confirmerImport = () => {
      if (processedData && processedData.data) {
        importerBeneficiaires(processedData.data);
        setProcessedData(null);
      }
    };
  
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">Importation depuis Excel</h2>
        
        {/* Zone de dépôt de fichier */}
        <div 
          className={`file-upload-area ${dragActive ? 'drag-over' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
          />
          
          <div className="upload-icon mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <p className="text-gray-700 mb-2">Glissez et déposez votre fichier ici, ou</p>
          <button 
            onClick={onButtonClick}
            className="btn btn-primary"
          >
            Sélectionner un fichier Excel
          </button>
          
          <p className="text-sm text-gray-500 mt-4">
            Formats supportés: .xlsx, .xls, .csv<br />
            Colonnes attendues: Nom, Téléphone, Référence, Mode de paiement
          </p>
        </div>
        
        {/* Affichage pendant le traitement */}
        {isProcessing && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center justify-center">
            <svg className="loading-spinner h-5 w-5 mr-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Traitement du fichier en cours...</span>
          </div>
        )}
        
        {/* Prévisualisation des données */}
        {processedData && (
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Aperçu de l'importation</h3>
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {processedData.rowCount} enregistrements
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">
              Fichier: <span className="font-medium">{processedData.fileName}</span>
            </p>
            
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full border border-gray-300 rounded">
                <thead className="bg-gray-100">
                  <tr>
                    {processedData.headers.map((header, index) => (
                      <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {processedData.preview.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {processedData.headers.map((header, colIndex) => (
                        <td key={colIndex} className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {processedData.rowCount > 3 && (
              <p className="text-sm text-gray-500 mt-2 italic">
                ... et {processedData.rowCount - 3} autres enregistrements
              </p>
            )}
            
            <div className="mt-4 flex justify-end space-x-3">
              <button 
                onClick={() => setProcessedData(null)}
                className="btn btn-outline"
              >
                Annuler
              </button>
              <button 
                onClick={confirmerImport}
                className="btn btn-primary"
              >
                Confirmer l'importation
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Onglet Ajout
  const AddTab = ({ ajouterBeneficiaire, apiSettings, dateNotification }) => {
    const [nouveauBeneficiaire, setNouveauBeneficiaire] = React.useState({
      nom: '',
      telephone: '',
      reference: '',
      modePaiement: 'especes'
    });
    
    // Gestion des changements dans le formulaire
    const handleChange = (e) => {
      const { name, value } = e.target;
      setNouveauBeneficiaire({
        ...nouveauBeneficiaire,
        [name]: value
      });
    };
    
    // Soumission du formulaire
    const handleSubmit = (e) => {
      e.preventDefault();
      
      // Validation basique
      if (!nouveauBeneficiaire.nom.trim() || !nouveauBeneficiaire.telephone.trim() || !nouveauBeneficiaire.reference.trim()) {
        alert("Veuillez remplir tous les champs obligatoires");
        return;
      }
      
      // Ajout du bénéficiaire
      ajouterBeneficiaire(nouveauBeneficiaire);
      
      // Réinitialisation du formulaire
      setNouveauBeneficiaire({
        nom: '',
        telephone: '',
        reference: '',
        modePaiement: 'especes'
      });
    };
  
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">Ajout manuel</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label htmlFor="nom" className="form-label">Nom du bénéficiaire</label>
            <input
              type="text"
              id="nom"
              name="nom"
              value={nouveauBeneficiaire.nom}
              onChange={handleChange}
              placeholder="Nom complet"
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="telephone" className="form-label">Téléphone</label>
            <input
              type="tel"
              id="telephone"
              name="telephone"
              value={nouveauBeneficiaire.telephone}
              onChange={handleChange}
              placeholder="Numéro de téléphone"
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="reference" className="form-label">Numéro de bulletin</label>
            <input
              type="text"
              id="reference"
              name="reference"
              value={nouveauBeneficiaire.reference}
              onChange={handleChange}
              placeholder="Référence"
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="modePaiement" className="form-label">Mode de paiement</label>
            <div className="mt-1 grid grid-cols-2 gap-3">
              <div 
                className={`payment-method-card cursor-pointer ${nouveauBeneficiaire.modePaiement === 'especes' ? 'selected' : ''}`}
                onClick={() => setNouveauBeneficiaire({...nouveauBeneficiaire, modePaiement: 'especes'})}
              >
                <div className="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span>Espèces</span>
              </div>
              <div 
                className={`payment-method-card cursor-pointer ${nouveauBeneficiaire.modePaiement === 'virement' ? 'selected' : ''}`}
                onClick={() => setNouveauBeneficiaire({...nouveauBeneficiaire, modePaiement: 'virement'})}
              >
                <div className="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <span>Virement</span>
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Ajouter le bénéficiaire
            </button>
          </div>
        </form>
        
        <div className="mt-8 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-md font-medium text-blue-800 mb-2">Aperçu du message</h3>
          <p className="text-sm text-blue-700 whitespace-pre-wrap">
            {(() => {
              // Simulation du genererMessageSMS pour l'aperçu
              let message = apiSettings.messageTemplate;
              message = message.replace(/{nom}/g, nouveauBeneficiaire.nom || '[NOM]');
              message = message.replace(/{reference}/g, nouveauBeneficiaire.reference || '[RÉFÉRENCE]');
              const modePaiementFormate = nouveauBeneficiaire.modePaiement === 'especes' ? 'numéraire' : 'virement bancaire';
              message = message.replace(/{modePaiement}/g, modePaiementFormate);
              message = message.replace(/{date}/g, dateNotification);
              return message;
            })()}
          </p>
        </div>
      </div>
    );
  };
  
  // Onglet Paramètres
  const SettingsTab = ({ apiSettings, setApiSettings, showNotification }) => {
    const [formSettings, setFormSettings] = React.useState({...apiSettings});
    const [showTemplateHelp, setShowTemplateHelp] = React.useState(false);
    
    // Gestion des changements dans le formulaire
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormSettings({
        ...formSettings,
        [name]: value
      });
    };
    
    // Sauvegarde des paramètres
    const saveSettings = (e) => {
      e.preventDefault();
      setApiSettings(formSettings);
      showNotification('Paramètres enregistrés avec succès', 'success');
    };
  
    // Réinitialisation du modèle de message
    const resetMessageTemplate = () => {
      if (confirm('Êtes-vous sûr de vouloir réinitialiser le modèle de message ?')) {
        setFormSettings({
          ...formSettings,
          messageTemplate: 'Bonjour M. {nom} votre bon de commande numéro {reference} est programmé pour paiement en {modePaiement}. Bien vouloir vous présenter au service de la comptabilité de la Trésorerie générale de Yaoundé 2. Cordialement'
        });
        showNotification('Modèle de message réinitialisé', 'info');
      }
    };
  
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">Paramètres</h2>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Ces paramètres sont nécessaires pour envoyer des SMS via l'API SMS Global. Les informations d'identification restent stockées uniquement sur votre appareil.
              </p>
            </div>
          </div>
        </div>
        
        <form onSubmit={saveSettings} className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">Clé API</label>
            <input
              type="text"
              id="apiKey"
              name="apiKey"
              value={formSettings.apiKey}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              placeholder="Entrez votre clé API"
            />
          </div>
          
          <div>
            <label htmlFor="secretKey" className="block text-sm font-medium text-gray-700">Clé secrète</label>
            <input
              type="password"
              id="secretKey"
              name="secretKey"
              value={formSettings.secretKey}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              placeholder="Entrez votre clé secrète"
            />
          </div>
          
          <div>
            <label htmlFor="senderName" className="block text-sm font-medium text-gray-700">Nom de l'expéditeur</label>
            <input
              type="text"
              id="senderName"
              name="senderName"
              value={formSettings.senderName}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              placeholder="Nom qui apparaîtra comme expéditeur du SMS"
              maxLength={11}
            />
            <p className="mt-1 text-xs text-gray-500">Maximum 11 caractères, sans espaces ni caractères spéciaux</p>
          </div>
          
          <div className="mt-6 border-t pt-6">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="messageTemplate" className="block text-sm font-medium text-gray-700">Modèle de message</label>
              <div className="flex items-center">
                <button 
                  type="button" 
                  onClick={resetMessageTemplate}
                  className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 mr-2"
                >
                  Réinitialiser
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowTemplateHelp(!showTemplateHelp)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            </div>
            
            {showTemplateHelp && (
              <div className="bg-blue-50 p-3 rounded mb-2 text-sm text-blue-800">
                <p className="font-medium mb-1">Variables disponibles:</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li><code className="bg-blue-100 px-1 rounded">{'{nom}'}</code> - Nom du bénéficiaire</li>
                  <li><code className="bg-blue-100 px-1 rounded">{'{reference}'}</code> - Numéro de référence</li>
                  <li><code className="bg-blue-100 px-1 rounded">{'{modePaiement}'}</code> - Mode de paiement (numéraire/virement)</li>
                  <li><code className="bg-blue-100 px-1 rounded">{'{date}'}</code> - Date de paiement</li>
                </ul>
              </div>
            )}
            
            <textarea
              id="messageTemplate"
              name="messageTemplate"
              value={formSettings.messageTemplate}
              onChange={handleChange}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              placeholder="Modèle de message avec variables {nom}, {reference}, {modePaiement}, {date}"
            />
            <p className="mt-1 text-xs text-gray-500">
              Utilisez les variables entre accolades pour personnaliser le message
            </p>
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              className="btn btn-primary"
            >
              Enregistrer les paramètres
            </button>
          </div>
        </form>
        
        <div className="mt-10 border-t pt-6">
          <h3 className="text-lg font-medium mb-3">À propos de cette application</h3>
          <p className="text-sm text-gray-600">
            Cette application permet d'envoyer des notifications de paiement par SMS à des bénéficiaires. Toutes les données sont stockées localement sur votre appareil et ne sont pas partagées avec des serveurs externes, à l'exception des informations nécessaires pour l'envoi des SMS via l'API SMS Global.
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Version 1.0.0
          </p>
        </div>
      </div>
    );
  };
  
  // Rendu de l'application
  ReactDOM.render(<App />, document.getElementById('app'));