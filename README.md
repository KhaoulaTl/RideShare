
# CovoiT - RideShare Application

Le projet RideShare est une plateforme de covoiturage visant à simplifier le processus de partage de trajets entre conducteurs et passagers. Cette application offre une solution conviviale pour les utilisateurs souhaitant économiser sur les coûts de transport, réduire leur empreinte carbone et favoriser le partage de ressources.


# Fonctionnalités Principales
#### - Publication de Covoiturages : 
Les conducteurs peuvent publier des détails sur leurs trajets planifiés, y compris les lieux de départ et d'arrivée, la date, le nombre de places disponibles, et d'autres informations pertinentes.

#### - Recherche de Covoiturages : 
Les passagers peuvent rechercher des covoiturages disponibles en spécifiant leur lieu de départ, leur destination et d'autres critères pertinents ( Date et Heure ) .

#### - Réservation de Places : 
Les passagers peuvent réserver des places dans les covoiturages disponibles, et les conducteurs peuvent accepter ou rejeter ces réservations.

#### - Gestion des Covoiturages : 
Les conducteurs peuvent gérer leurs covoiturages publiés, voir les réservations en attente, accepter ou rejeter des passagers, et mettre à jour les détails du covoiturage.

#### - Système d'Authentification : 
Une authentification sécurisée est mise en place pour garantir que seuls les utilisateurs enregistrés peuvent publier ou réserver des covoiturages.

*************************************************************************************************************************

# Technologies Utilisées

* Backend :
####  Node.js, Express.js

* Base de Données :
####  MongoDB ATLAS

* Authentification :
#### JSON Web Tokens (JWT)

* Géocodage : 
#### API de géocodage pour convertir des adresses en coordonnées géographiques.

* Frontend :
#### Angular

**************************************************************************************************************************

# Installation et Exécution


- Accédez au répertoire :

#### cd Covoiturage-backend && cd Covoiturage_frontend



- Installez les dépendances du serveur :

####  npm install



- Installez les dépendances du client :
####  cd CovoiT && npm install



- Configurez les variables d'environnement (base de données, clé secrète JWT, etc.).


- Lancez le serveur : 

#### node covoiturage.js


- Lancez l'application client : 

#### ng serve

