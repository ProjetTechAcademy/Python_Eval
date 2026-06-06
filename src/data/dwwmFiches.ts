import { Fiche } from '../types';

const rawDwwmItems = [
  // Bloc 00 : Introduction et Fondamentaux
  // Module 01 : Culture Générale Numérique
  {
    id: 1001,
    title: "B00_M01_001 - L’histoire de l’informatique et d’Internet, culture générale numérique",
    url: "https://drive.google.com/file/d/11UfQzUaPwXGQIC3v0A0f31KYs9G-_DXH/view?usp=drive_link"
  },
  {
    id: 1002,
    title: "B00_M01_002 - Le fonctionnement d’Internet",
    url: "https://drive.google.com/file/d/1aZZFcq6CGDOcyJJozrCRw3eRwtvLEQ6E/view?usp=drive_link"
  },
  {
    id: 1003,
    title: "B00_M01_003 - Sensibilisation à la cybersécurité",
    url: "https://drive.google.com/file/d/1R5Mv15X0XIasOSKR4g4ScRAJNw4_9nPo/view?usp=drive_link"
  },
  {
    id: 1004,
    title: "B00_M01_004 - Les droits d’auteur et licences libres",
    url: "https://drive.google.com/file/d/1WmrqwqcdfHkguZ7qkhvv2nb9CuuAj0PC/view?usp=drive_link"
  },
  {
    id: 1005,
    title: "B00_M01_005 - La sensibilisation à la RGPD",
    url: "https://drive.google.com/file/d/1IppfkOjQgI4rnyq-5X_7ZIZD0tlfFBE9/view?usp=drive_link"
  },
  {
    id: 1006,
    title: "B00_M01_007 - Github Student Developper Pack",
    url: "https://drive.google.com/file/d/1drlsEi4vJdKjjRGGouxuY4MdKBp43HaI/view?usp=drive_link"
  },
  {
    id: 1007,
    title: "B00_M01_008 - La suite Jetbrains",
    url: "https://drive.google.com/file/d/1s0BZ6RUTsluWPP21Edhz_WClezGR5h1W/view?usp=drive_link"
  },
  {
    id: 1008,
    title: "B00_M01_009 - VSCode",
    url: "https://drive.google.com/file/d/1217ugJ7LVk00sz76lTgHDQp2Q54mADSr/view?usp=drive_link"
  },
  {
    id: 1009,
    title: "B00_M01_010 - La préparation de l’environnement de travail localhost",
    url: "https://drive.google.com/file/d/1zth8D5JmUu2PYj_qdSitHX0MK1MLK0PB/view?usp=drive_link"
  },
  {
    id: 1010,
    title: "B00_M01_011 - Installer Linux sur Windows et MacOS",
    url: "https://drive.google.com/file/d/1DxwNaNVQY-BmpTy7geS6md8oSHJslGaB/view?usp=drive_link"
  },
  {
    id: 1011,
    title: "B00_M01_012 - Jeux de logique",
    url: "https://drive.google.com/file/d/1XSJs5_Adj1prPTpQUi1wnjD8qCz3x-Hv/view?usp=drive_link"
  },
  {
    id: 1012,
    title: "B00_M01_013 - Assurer une veille technologique en développement",
    url: "https://drive.google.com/file/d/1-_leZCdkQnRTlc7f5AH6Q2nXMU0jRU9K/view?usp=drive_link"
  },
  {
    id: 1013,
    title: "B00_M01_014 - Application - Connaître l’écosystème et installer les outils du développeur",
    url: "https://drive.google.com/file/d/1coaTi4XGlv8fhC52rFjuDvq2Qq3nJnFA/view?usp=drive_link"
  },

  // Module 02 : Introduction à la Programmation
  {
    id: 1014,
    title: "B00_M02_000 - On-boarding - Introduction à la programmation",
    url: "https://drive.google.com/file/d/1N2Cttv0Oe3Au_0qTbpBrOxIipy3A90xP/view?usp=drive_link"
  },
  {
    id: 1015,
    title: "B00_M02_001 - Introduction à la programmation",
    url: "https://drive.google.com/file/d/1VeJBAf9QMOP1tfPxwzl2e24sBg837vQG/view?usp=drive_link"
  },
  {
    id: 1016,
    title: "B00_M02_002 - Introduction aux variables",
    url: "https://drive.google.com/file/d/19TaSLnu6eULDVWswCuLo4OA1F5D_IDXZ/view?usp=drive_link"
  },
  {
    id: 1017,
    title: "B00_M02_003 - Les opérateurs et opérateurs logiques",
    url: "https://drive.google.com/file/d/1xPDDlolhAPWi_ugYkhS3mN4dz0xtl-80/view?usp=drive_link"
  },
  {
    id: 1018,
    title: "B00_M02_004 - Les structures de contrôle",
    url: "https://drive.google.com/file/d/1XUDAflZCEDFsk5MzwFNDCP6fAwpEcEBs/view?usp=drive_link"
  },
  {
    id: 1019,
    title: "B00_M02_005 - En bref - les bonnes pratiques de codage",
    url: "https://drive.google.com/file/d/12aY5c_z6YZVUgygz3jkJudX1HLOOh7W-/view?usp=drive_link"
  },
  {
    id: 1020,
    title: "B00_M02_006 - Les chaînes de caractère",
    url: "https://drive.google.com/file/d/12NfleEgqR1bo-6Zij9bSivDvkzuhsBn9/view?usp=drive_link"
  },
  {
    id: 1021,
    title: "B00_M02_007 - Les structures de données",
    url: "https://drive.google.com/file/d/1Jt0RVi18cBUqx_WHFiapAntNxEa7hxDN/view?usp=drive_link"
  },
  {
    id: 1022,
    title: "B00_M02_008 - Le type de données Date",
    url: "https://drive.google.com/file/d/1DSbFCNfHfyKtnj3Tq1kphd28m-8AJepN/view?usp=drive_link"
  },
  {
    id: 1023,
    title: "B00_M02_009 - Les fonctions",
    url: "https://drive.google.com/file/d/1h2Mo8nmJTUvVVMpJ6Sb82Zrj2yQpg0pv/view?usp=drive_link"
  },
  {
    id: 1024,
    title: "B00_M02_010 - Off-boarding - Introduction à la programmation",
    url: "https://drive.google.com/file/d/1e7cFi9RKiHfxoBcPSt9YXUyxFc3yyDb_/view?usp=drive_link"
  },
  {
    id: 1025,
    title: "B00_M02_011 - Auto-évaluation - Introduction à la programmation",
    url: "https://drive.google.com/file/d/10OVpSFWifkVQeFeulspOM0_JJnX-vark/view?usp=drive_link"
  },
  {
    id: 1026,
    title: "B00_M02_012 - Application - Introduction à la programmation",
    url: "https://drive.google.com/file/d/1ELN7DIc367OG3nJHXCL7KrD1mWXg5Bya/view?usp=drive_link"
  },

  // Module 03 : Introduction à l'Algorithme
  {
    id: 1027,
    title: "B00_M03_001 - On-boarding - Introduction à l’algorithme",
    url: "https://drive.google.com/file/d/1FGvP-X274A1a8GYQE01ilG42CtXXwq0K/view?usp=drive_link"
  },
  {
    id: 1028,
    title: "B00_M03_002 - La représentation graphique d’un algorithme - flowchart",
    url: "https://drive.google.com/file/d/1Je5l8UT3mia1TwzHwNZHmKh1wJwxBxp-/view?usp=drive_link"
  },
  {
    id: 1029,
    title: "B00_M03_003 - L’écriture en pseudo-code - introduction",
    url: "https://drive.google.com/file/d/1WjeyGnxDmTu8TqJpUAOC_oU4JTLuLMco/view?usp=drive_link"
  },
  {
    id: 1030,
    title: "B00_M03_004 - L’écriture d’un algorithme en pseudo-code - approfondissement",
    url: "https://drive.google.com/file/d/1Zz9CqD4hHm5Dgo6SR_oM_L0GeYZQ7A7g/view?usp=drive_link"
  },
  {
    id: 1031,
    title: "B00_M03_005 - Mon premier algorithme",
    url: "https://drive.google.com/file/d/1Jr2Pnr467oHEqao_kdr0CbUWwJGEQM7x/view?usp=drive_link"
  },
  {
    id: 1032,
    title: "B00_M03_006 - Les fonctions",
    url: "https://drive.google.com/file/d/1T7qRmCetxYm8hozpIML46mwCjphooqTt/view?usp=drive_link"
  },
  {
    id: 1033,
    title: "B00_M03_007 - Les objets et les classes",
    url: "https://drive.google.com/file/d/1cNSlO2mYA8VB_nDxzgIWe3IxOL_t7ipi/view?usp=drive_link"
  },
  {
    id: 1034,
    title: "B02_M03_008 - La récursivité",
    url: "https://drive.google.com/file/d/1dd2OHnzAFiZrVjD4O4jvMFuFsTMU7_Mx/view?usp=drive_link"
  },
  {
    id: 1035,
    title: "B00_M03_009 - Off-boarding - Introduction à l’algorithme",
    url: "https://drive.google.com/file/d/1BQiJ5CC8wlt4RBozYPnezmz3BVM3Ksdu/view?usp=drive_link"
  },
  {
    id: 1036,
    title: "B00_M03_010 - Auto-évaluation - Introduction à l’algorithme",
    url: "https://drive.google.com/file/d/1BHsl4XiyIeb4EjDTohq-AJlB4fRB4GY8/view?usp=drive_link"
  },
  {
    id: 1037,
    title: "B00_M03_011 - Application - Introduction à l’algorithme",
    url: "https://drive.google.com/file/d/1jbjYURnHeTGAH1F2T877xfNCvrZwbUtC/view?usp=drive_link"
  },

  // Bloc 01 : Développer la partie front-end d’une application web ou web mobile sécurisée
  {
    id: 1038,
    title: "B01_M01_000 - Guide du bloc - Développer la partie front-end d’une application web ou web mobile sécurisée",
    url: "https://drive.google.com/file/d/17cQsDSnls8itENDoQsKuwbqITCZGjrvz/view?usp=drive_link"
  },

  // Module 01 : Environnement et Modèles de Gestion de Projet
  {
    id: 1039,
    title: "B01_M01_001 - L’environnement du développeur web",
    url: "https://drive.google.com/file/d/1gt3hzW5EDmnOTpQFczUHRQlydPevEgSu/view?usp=drive_link"
  },
  {
    id: 1040,
    title: "B01_M01_002 - Les modèles de gestion de projet",
    url: "https://drive.google.com/file/d/1_786pwmQvOOSJ6hwYGhbK3NwM9IB7MoY/view?usp=drive_link"
  },
  {
    id: 1041,
    title: "B01_M01_003 - Les outils collaboratifs de partage de ressources",
    url: "https://drive.google.com/file/d/1pz-6ODxZXz1oopj6gAGfe5Fvel9oaB16/view?usp=drive_link"
  },
  {
    id: 1042,
    title: "B01_M01_004 - Le récit utilisateur (user story)",
    url: "https://drive.google.com/file/d/1etXnnctBXny9upHs6JYWOglOgiP3XxHA/view?usp=drive_link"
  },
  {
    id: 1043,
    title: "B01_M01_005 - Bien rédiger ses user stories",
    url: "https://drive.google.com/file/d/1ulo-lBHTktwKGELcgCLB29IlyL0kJEjz/view?usp=drive_link"
  },

  // Module 02 : Conception UX/UI et Maquettage Figma
  {
    id: 1044,
    title: "B01_M02_001 - Introduction aux concepts UX (versus UI)",
    url: "https://drive.google.com/file/d/1yn_QMD0TT1PwZE2Py9BaPMNideyhBbG8/view?usp=drive_link"
  },
  {
    id: 1045,
    title: "B01_M02_002 - Planifier et suivre les tâches du maquettage",
    url: "https://drive.google.com/file/d/10XaNeX-xedNam1CfaDFoIjaUTpEfeOtK/view?usp=drive_link"
  },
  {
    id: 1046,
    title: "B01_M02_003 - Prendre en main Figma et son interface",
    url: "https://drive.google.com/file/d/1a4UBQBlRDPUIl3ACWzRZMAsXGG2wiUi8/view?usp=drive_link"
  },
  {
    id: 1047,
    title: "B01_M02_004 - Importer et exporter des fichiers sur Figma",
    url: "https://drive.google.com/file/d/15QyMTBvReBGO3cgf41JB1Bj5MYX7YX6b/view?usp=drive_link"
  },
  {
    id: 1048,
    title: "B01_M02_005 - Créer des composants sur Figma",
    url: "https://drive.google.com/file/d/1ReC9Voh0pvqe-3UA8ujjJ8Uidf1gQfw9/view?usp=drive_link"
  },
  {
    id: 1049,
    title: "B01_M02_006 - Utiliser les composants animés sur Figma",
    url: "https://drive.google.com/file/d/12OegE8u9_YD6ywt51Co7FEtg1Qnk5YBu/view?usp=drive_link"
  },
  {
    id: 1050,
    title: "B01_M02_007 - Créer un design responsive sur Figma",
    url: "https://drive.google.com/file/d/1dUQ1RsipnCxeEpsBLvXJh3FYpbfOaKpC/view?usp=drive_link"
  },
  {
    id: 1051,
    title: "B01_M02_008 - Créer un prototype, le partager et l’exporter avec Figma",
    url: "https://drive.google.com/file/d/1p_fwHRPv-DJYuK4A4qMkFOQ2wxtT_CBg/view?usp=drive_link"
  },
  {
    id: 1052,
    title: "B01_M02_009 - Prendre en compte l’accessibilité visuelle sur Figma",
    url: "https://drive.google.com/file/d/1POPWLaBPJquOpmIYHMfOb06yvtuDIOEd/view?usp=drive_link"
  },
  {
    id: 1053,
    title: "B01_M02_010 - Collaborer avec Figma",
    url: "https://drive.google.com/file/d/1TcZt8n1UcZu2vUIAgAPiGNKSx9EtEMCx/view?usp=drive_link"
  },
  {
    id: 1054,
    title: "B01_M02_011 - Découvrir le Dev Mode de Figma",
    url: "https://drive.google.com/file/d/1y970tPiMvrRK07IxVCIWWia1xMl79OJu/view?usp=drive_link"
  },

  // Module 03 : Intégration Web (HTML5, CSS3, Bootstrap) et Qualité
  {
    id: 1055,
    title: "B01_M03_001 - Introduction au HTML",
    url: "https://drive.google.com/file/d/1dxg_LUN5R0es3xGpel9SFlnvpIn_BymR/view?usp=drive_link"
  },
  {
    id: 1056,
    title: "B01_M03_002 - Syntaxe générale de HTML",
    url: "https://drive.google.com/file/d/1p9p9d6ukc3sjaDTln7f1YKUTY2V_RaFJ/view?usp=drive_link"
  },
  {
    id: 1057,
    title: "B01_M03_003 - L’organisation du texte",
    url: "https://drive.google.com/file/d/1n_zZvilugxnuO86Oc9twy5JHZlYhNPke/view?usp=drive_link"
  },
  {
    id: 1058,
    title: "B01_M03_004 - Un langage hypertexte",
    url: "https://drive.google.com/file/d/1mI1IbXRCTa2M8bf7PmShNlbE4hFyQ6pU/view?usp=drive_link"
  },
  {
    id: 1059,
    title: "B01_M03_005 - Le multimédia en HTML",
    url: "https://drive.google.com/file/d/1erwpdGyVNjcfDbCjmXliMgq6Gfr0a1iB/view?usp=drive_link"
  },
  {
    id: 1060,
    title: "B01_M03_006 - Introduction au CSS",
    url: "https://drive.google.com/file/d/1a773twPgO-WoTHfEL9oQwAB2oUBGfM7L/view?usp=drive_link"
  },
  {
    id: 1061,
    title: "B01_M03_007 - CSS3 - Le stylage du texte",
    url: "https://drive.google.com/file/d/1pXIRpTTjkWOeevMRG4knErhBUTBuC9j7/view?usp=drive_link"
  },
  {
    id: 1062,
    title: "B01_M03_008 - La structuration logique en HTML5 et le modèle de boîtes en CSS3",
    url: "https://drive.google.com/file/d/1FlnWwEE_yLp9jgv3lKQYSRvT7Takz_3W/view?usp=drive_link"
  },
  {
    id: 1063,
    title: "B01_M03_009 - Les sélecteurs CSS",
    url: "https://drive.google.com/file/d/13yjf3Qyo6oF4z4mO2BDL_3O73vTLx_0K/view?usp=drive_link"
  },
  {
    id: 1064,
    title: "B01_M03_010 - La mise en page avec CSS",
    url: "https://drive.google.com/file/d/1jGMDxetB1XWpPrVCNgwC6KTSKsifkumi/view?usp=drive_link"
  },
  {
    id: 1065,
    title: "B01_M03_011 - La création de tableaux",
    url: "https://drive.google.com/file/d/1SwmforruKJ_va-wHzQIaAjw18SPsNsqb/view?usp=drive_link"
  },
  {
    id: 1066,
    title: "B01_M03_012 - La création de formulaires",
    url: "https://drive.google.com/file/d/1IjAUPb_opwweVrgp--J6D5EltXeCUZ3G/view?usp=drive_link"
  },
  {
    id: 1067,
    title: "B01_M03_013 - Layout avec CSS Grid",
    url: "https://drive.google.com/file/d/14AKnwNoYIP2td32HDFhcnBqnBHNkeIwt/view?usp=drive_link"
  },
  {
    id: 1068,
    title: "B01_M03_014 - Les effets avancés de CSS",
    url: "https://drive.google.com/file/d/1vGCyD3ibaxWWhVvnj1SzX0e7kHFP8slU/view?usp=drive_link"
  },
  {
    id: 1069,
    title: "B01_M03_015 - Le responsive design",
    url: "https://drive.google.com/file/d/1Fbyv4tPuZWx1fif9jlDJxA_azWcCGSAO/view?usp=drive_link"
  },
  {
    id: 1070,
    title: "B01_M03_016 - Introduction à Bootstrap",
    url: "https://drive.google.com/file/d/1N5Arb1j523lIBLfBUGH1sh4Dnxrbw_EW/view?usp=drive_link"
  },
  {
    id: 1071,
    title: "B01_M03_017 - Ouverture vers d’autres frameworks CSS",
    url: "https://drive.google.com/file/d/11_SSXUrOeXyHsyBRD4NcTTt-S3bfGJ6-/view?usp=drive_link"
  },
  {
    id: 1072,
    title: "B01_M03_018 - Le référencement des sites Web",
    url: "https://drive.google.com/file/d/1RRogkc3_v3L2R8tBKgRCLAUPxG3mSsyW/view?usp=drive_link"
  },
  {
    id: 1073,
    title: "B01_M03_019 - Valider la qualité de son site",
    url: "https://drive.google.com/file/d/18LGL-un1NmBm8zyemb0Ypg0hktVsd4_2/view?usp=drive_link"
  },
  {
    id: 1074,
    title: "B01_M03_020 - Déployer son site sur le web",
    url: "https://drive.google.com/file/d/1ouBlwAEuX0v4Muk6x0TbSgpYB5lsfoH8/view?usp=drive_link"
  },

  // Module 04 : Content Management System (WordPress)
  {
    id: 1075,
    title: "B01_M04_001 - Installer et configurer WordPress sur son serveur - Hello world",
    url: "https://drive.google.com/file/d/1Q9CKbjnb8Lf-c0dU0zBYnM0_cUeX3NqX/view?usp=drive_link"
  },
  {
    id: 1076,
    title: "B01_M04_002 - L’administration de son site wordpress",
    url: "https://drive.google.com/file/d/1p-5gxgotdihM4OHKKVIlwtJzIIs-5cbi/view?usp=drive_link"
  },
  {
    id: 1077,
    title: "B01_M04_003 - Les paramètres d’un site Wordpress",
    url: "https://drive.google.com/file/d/1opisDbvLnWZWFCUBN8MfvlKNTyEKPrvp/view?usp=drive_link"
  },
  {
    id: 1078,
    title: "B01_M04_004 - Les solutions de paiement en ligne",
    url: "https://drive.google.com/file/d/1QlKi2LJrF3lO3NIRP9PC2GOerHvb9PNF/view?usp=drive_link"
  },

  // Module 05 : Programmation Dynamique Front-End (JavaScript Fondamentaux)
  {
    id: 1079,
    title: "B01_M05_001 - Introduction à javascript",
    url: "https://drive.google.com/file/d/1X5rEX4EmHVojl5G03t5nP2eeUe_PIugu/view?usp=drive_link"
  },
  {
    id: 1080,
    title: "B01_M05_002 - Syntaxe et intégration de JS",
    url: "https://drive.google.com/file/d/1DB-8oqFVLiM0rsk7hp-OT8ftrweCEfdw/view?usp=drive_link"
  },
  {
    id: 1081,
    title: "B01_M05_003 - Les variables en JS",
    url: "https://drive.google.com/file/d/1Je6v_YWzDI39oeWaXw2p9byIrFGAmU_P/view?usp=drive_link"
  },
  {
    id: 1082,
    title: "B01_M05_004 - Les opérateurs",
    url: "https://drive.google.com/file/d/1Zh8UGuD59DmKSvO2qXFIyJYyVwk_WVCu/view?usp=drive_link"
  },
  {
    id: 1083,
    title: "B01_M05_005 - Structures de contrôle en JS",
    url: "https://drive.google.com/file/d/11ccYfMifwPOS3KU632nULUhGyRNf2wrw/view?usp=drive_link"
  },
  {
    id: 1084,
    title: "B01_M05_006 - Les boucles",
    url: "https://drive.google.com/file/d/1fFXwO1ByzYRRx7o-c7zOfGTEIUgxeoko/view?usp=drive_link"
  },
  {
    id: 1085,
    title: "B01_M05_007 - Les fonctions en JS",
    url: "https://drive.google.com/file/d/1tSqUnIfxS1B6WsXTfZvLZ-ol3-E92m5F/view?usp=drive_link"
  },
  {
    id: 1086,
    title: "B01_M05_008 - Les types de données",
    url: "https://drive.google.com/file/d/1eBVk2Slg__A1SpfzvU9occV5JbzbhKdk/view?usp=drive_link"
  },
  {
    id: 1087,
    title: "B01_M05_009 - L’objet JavaScript Number",
    url: "https://drive.google.com/file/d/1sLnuzLEI4Zj-8CTpMqI5Fet2iC5h8lB_/view?usp=drive_link"
  },
  {
    id: 1088,
    title: "B01_M05_010 - Les objets JavaScript String et Array",
    url: "https://drive.google.com/file/d/1vicbkNsEfSzNVP36mv6jaN7iDly_uPNL/view?usp=drive_link"
  },
  {
    id: 1089,
    title: "B01_M05_011 - Les objets JS",
    url: "https://drive.google.com/file/d/1uOpTaeVHZjJ6vHewvN8Tr4Ed3Vk6LlXJ/view?usp=drive_link"
  },
  {
    id: 1090,
    title: "B01_M05_012 - Les classes et l’instanciation d’objet",
    url: "https://drive.google.com/file/d/10Nx-NgA5kwTebOhweX7AIv_G5rTmtyB7/view?usp=drive_link"
  },
  {
    id: 1091,
    title: "B01_M05_013 - L’objet Date",
    url: "https://drive.google.com/file/d/1LA6USTEmJNSSqb37yDbkANI-hvPeZIMZ/view?usp=drive_link"
  },
  {
    id: 1092,
    title: "B01_M05_014 - Introduction au Document Object Model",
    url: "https://drive.google.com/file/d/1oQs5C0oHcOzGV2Noa4CQdTWOS4u82oDH/view?usp=drive_link"
  },
  {
    id: 1093,
    title: "B01_M05_015 - Projet d’application - formulaire dynamique avec JS",
    url: "https://drive.google.com/file/d/1nxocl4Q1p00VqLBNdXgx2wuxeH7dzgvG/view?usp=drive_link"
  },

  // Module 06 : JavaScript Avancé, Programmation Asynchrone et TypeScript
  {
    id: 1094,
    title: "B01_M06_001 - JS Browser BOM (window - screen - Location - History, etc)",
    url: "https://drive.google.com/file/d/1Q6jo8aB3V1nt71a4j7D0zCXXihfFcdaq/view?usp=drive_link"
  },
  {
    id: 1095,
    title: "B01_M06_002 - Fonction asynchrone et callback",
    url: "https://drive.google.com/file/d/1CzTO9PBzrUqiTP0_af0ot6TcLSUb7ZSe/view?usp=drive_link"
  },
  {
    id: 1096,
    title: "B01_M06_003 - Le format JSON et AJAX",
    url: "https://drive.google.com/file/d/1JWUOsGGDx5ADFgXtciw94ZZrN1itqGnb/view?usp=drive_link"
  },
  {
    id: 1097,
    title: "B01_M06_004 - Les promesses",
    url: "https://drive.google.com/file/d/1fxBmsfEuqu20JgU7sDdfRZYp6hihm_mC/view?usp=drive_link"
  },
  {
    id: 1098,
    title: "B01_M06_005 - Découverte des patrons de conception",
    url: "https://drive.google.com/file/d/1stZ6dcz59iYI-MYUrHVNO7yGGwf4STfI/view?usp=drive_link"
  },
  {
    id: 1099,
    title: "B01_M06_006 - JavaScript Events",
    url: "https://drive.google.com/file/d/1AcNNsDk5HtQVEoDGbTYGE5-QZnQaVUk7/view?usp=drive_link"
  },
  {
    id: 1100,
    title: "B01_M06_007 - Introduction et installation de TypeScript",
    url: "https://drive.google.com/file/d/1e-E1_xsbLxTTMgsmZxXsxoEqQPHf4LEW/view?usp=drive_link"
  },
  {
    id: 1101,
    title: "B01_M06_008 - Type de donnée avec TypesScript",
    url: "https://drive.google.com/file/d/1IDDGeKOeMU7h9AdV1QicYZL8QgZ-UaQv/view?usp=drive_link"
  },
  {
    id: 1102,
    title: "B01_M06_009 - Données avancée avec TypeScript",
    url: "https://drive.google.com/file/d/1FYi20XGimZA4REYeSZOYm4y2BrbGfWky/view?usp=drive_link"
  },
  {
    id: 1103,
    title: "B01_M06_010 - L’objet avec TypeScript",
    url: "https://drive.google.com/file/d/1Ye4FnJUzO_uih9SjQP6oMj6SSR1o7Ewi/view?usp=drive_link"
  },
  {
    id: 1104,
    title: "B01_M06_011 - JavaScript Graphics",
    url: "https://drive.google.com/file/d/12Oy7T2XzOmiILnTfFvwKqmwaXHJ1kKUz/view?usp=drive_link"
  },
  {
    id: 1105,
    title: "B01_M06_012 - JavaScript Canvas",
    url: "https://drive.google.com/file/d/1EaKY_5QfqROjLZ4hC7MVQFDMybOPKm9E/view?usp=drive_link"
  },
  {
    id: 1106,
    title: "B01_M06_013 - La Gestion d’erreur",
    url: "https://drive.google.com/file/d/1hcOJFdzWLDK5vcw8Yza7KXaeKADlfVlL/view?usp=drive_link"
  },
  {
    id: 1107,
    title: "B01_M06_014 - Debug",
    url: "https://drive.google.com/file/d/11mzrMXyUo7wM5GB_cOKnOkdocLXhBOQ0/view?usp=drive_link"
  },
  {
    id: 1108,
    title: "B01_M06_015 - Les bonnes pratiques de la programmation avec JS",
    url: "https://drive.google.com/file/d/1A-liBbzQwr_cjax4ehTxFc-ZxfVx_Wch/view?usp=drive_link"
  },
  {
    id: 1109,
    title: "B01_M06_016 - Projet - Memory game",
    url: "https://drive.google.com/file/d/1o3jKc22NvHpRudht_osjj258bivB_3gU/view?usp=drive_link"
  },

  // Module 07 : Gestion de Code Source et Versioning (Git & GitHub)
  {
    id: 1110,
    title: "B01_M07_001 - Introduction à la ligne de commande",
    url: "https://drive.google.com/file/d/1gFJkfzAesDM8Pik_tty7jFpmmidwLItJ/view?usp=drive_link"
  },
  {
    id: 1111,
    title: "B01_M07_002 - Introduction à Git et Github",
    url: "https://drive.google.com/file/d/1ROaM-X5FvYAsRxvkqw8AChhlISlvFAI_/view?usp=drive_link"
  },
  {
    id: 1112,
    title: "B01_M07_003 - Les bases",
    url: "https://drive.google.com/file/d/1aQqYA4jw64ij6je1J7_qery3AnGh9r2Z/view?usp=drive_link"
  },
  {
    id: 1113,
    title: "B01_M07_004 - Les interactions avec le dépôt distant",
    url: "https://drive.google.com/file/d/131ZyA1igqV-9310TTwB1-TcJV_Xr1lKZ/view?usp=drive_link"
  },
  {
    id: 1114,
    title: "B01_M07_005 - Naviguer dans l’historique",
    url: "https://drive.google.com/file/d/1XQY4aMy3tbVuv-cvyRskxCSi0Z7_qeCa/view?usp=drive_link"
  },
  {
    id: 1115,
    title: "B01_M07_006 - La gestion des branches",
    url: "https://drive.google.com/file/d/1_7dvz53qGp4m4xhCxJ8PD-Ueg-npGYjw/view?usp=drive_link"
  },
  {
    id: 1116,
    title: "B01_M07_007 - Les branches avec Git - Rebaser",
    url: "https://drive.google.com/file/d/1xjsmjpVltuGCRnicmV1Qxf2Ai89tsfww/view?usp=drive_link"
  },
  {
    id: 1117,
    title: "B01_M07_008 - Les bonnes pratiques",
    url: "https://drive.google.com/file/d/1dfbzeK0cSo0uRxG9R82Q0F9gam00CGvw/view?usp=drive_link"
  },
  {
    id: 1118,
    title: "B01_M07_009 - Projet - Utiliser Git et Github pour gérer son code source",
    url: "https://drive.google.com/file/d/1aWuXF4n8K2sn9Tx6NNvhBOXCWClzf8Cy/view?usp=drive_link"
  },

  // Module 08 : Déploiement Applicatif Cloud
  {
    id: 1119,
    title: "B01_M08_001 - La mise en ligne d’applications web avec Heroku",
    url: "https://drive.google.com/file/d/1d0O7f0YkYvv08IyKoLT94ZpTiPSO8oEn/view?usp=drive_link"
  },
  {
    id: 1120,
    title: "B01_M08_002 - Présentation et utilisation de Fly.io",
    url: "https://drive.google.com/file/d/1skBxU0X3RlwykgdaKQtURkgyxdw3Nqz5/view?usp=drive_link"
  },

  // Module 09 : Sécurisation de l'Application Web Mobile Front-End
  {
    id: 1121,
    title: "B01_M09_001 - Les principales failles de sécurité",
    url: "https://drive.google.com/file/d/1w_3vhR1TwrxcwoFnTTnChX250N6ZutJk/view?usp=drive_link"
  },
  {
    id: 1122,
    title: "B01_M09_002 - Les guides de tests",
    url: "https://drive.google.com/file/d/1IV_xVdoXygjgVgAInkBGBmiyooZDQRZE/view?usp=drive_link"
  },
  {
    id: 1123,
    title: "B01_M09_004 - Analyser la sécurité pour évaluer la vulnérabilité d’une application web",
    url: "https://drive.google.com/file/d/1L4jQLFv6KESgS00jqwzQtHbaJZXV2uB0/view?usp=drive_link"
  },
  {
    id: 1124,
    title: "B01_M09_005 - Sécuriser la publication d’une application web",
    url: "https://drive.google.com/file/d/1pMbJLyp7BKDWSBuQ38AbPGYWzT2sFq39/view?usp=drive_link"
  },

  // Module 10 : Conteneurisation (Docker)
  {
    id: 1125,
    title: "B01_M10_002 - L’outil Docker - principes, objectifs et solutions",
    url: "https://drive.google.com/file/d/1sSkL7c2tovzRzi_w2L5gdZbt1JvGslGy/view?usp=drive_link"
  },
  {
    id: 1126,
    title: "B01_M10_003 - Le Dockerfile et ses instructions",
    url: "https://drive.google.com/file/d/1g5c3oYHAmRUEcD4zNTSEkX_5CzBTGCiT/view?usp=drive_link"
  },
  {
    id: 1127,
    title: "B01_M10_004 - Docker Compose - Introduction",
    url: "https://drive.google.com/file/d/19BT0F6VYIx4xY79yMNBQGdti9RX8m0kb/view?usp=drive_link"
  },
  {
    id: 1128,
    title: "B01_M10_005 - Docker Compose - Étude de cas",
    url: "https://drive.google.com/file/d/1uvUIMEAiVkLYWE-3qsf1dp-s5CfJOHO5/view?usp=drive_link"
  },
  {
    id: 1129,
    title: "B01_M10_006 - L’automatisation de la création des containers avec un outil de type Docker",
    url: "https://drive.google.com/file/d/1SXU3N-5JM_awKGYm6OSt4fpTpUVaT0ta/view?usp=drive_link"
  },
  {
    id: 1130,
    title: "B01_M10_007 - L’utilisation des conteneurs pour gérer les mises à jour applicatives",
    url: "https://drive.google.com/file/d/1mhvPzsLh8nk-WyVIGD5cxvQZXXVQbfGz/view?usp=drive_link"
  },

  // Bloc 02 : Développer la partie back-end d’une application web ou web mobile sécurisée
  {
    id: 1131,
    title: "B02_M00_000 - Guide du bloc - Développer la partie back-end d’une application web ou web mobile sécurisée",
    url: "https://drive.google.com/file/d/1lan2E0mNem2QA7o2UdXc-XkvV9pd6tRO/view?usp=drive_link"
  },

  // Module 01 : Modélisation des Données (UML) et Introduction aux SGBD
  {
    id: 1132,
    title: "B02_M01_001 - Présentation de la notion base de données",
    url: "https://drive.google.com/file/d/1wX5OaCVXdjUfucmiC2w_pIgLl487HE-H/view?usp=drive_link"
  },
  {
    id: 1133,
    title: "B02_M01_002 - Installer un SGDB en ligne de commande",
    url: "https://drive.google.com/file/d/1uI4vvBvRKF5QLcALjPNxcPgAz3u29JCw/view?usp=drive_link"
  },
  {
    id: 1134,
    title: "B02_M01_003 - Créer une BDD et l’explorer",
    url: "https://drive.google.com/file/d/16RMw54BLpcUXXYgF9_b9_085y-wLHPu_/view?usp=drive_link"
  },
  {
    id: 1135,
    title: "B02_M01_004 - Introduction à la modélisation conceptuelle de données avec UML",
    url: "https://drive.google.com/file/d/1f8CPNgdkluLD0OwVNCB76BGTlDfx9f-7/view?usp=drive_link"
  },
  {
    id: 1136,
    title: "B02_M01_005 - Les diagrammes fonctionnels",
    url: "https://drive.google.com/file/d/1mpJcDMG1HR9bNuXmmhXWnC9vdsdz-bfl/view?usp=drive_link"
  },
  {
    id: 1137,
    title: "B02_M01_006 - Le diagramme de classe",
    url: "https://drive.google.com/file/d/1Zmt0ab972TYwjjfIsI_oCnw9meC-bze4/view?usp=drive_link"
  },
  {
    id: 1138,
    title: "B02_M01_007 - Introduction au passage UML-Relationnel",
    url: "https://drive.google.com/file/d/1lW4rKUKBDhoDjSFeKzZvKrbI3X25B-3G/view?usp=drive_link"
  },
  {
    id: 1139,
    title: "B02_M01_008 - Modèle relationnel Vs Objet",
    url: "https://drive.google.com/file/d/1l9anw-hRPBuGWWbQSz6TKktSfHx8TcL6/view?usp=drive_link"
  },
  {
    id: 1140,
    title: "B02_M01_009 - Introduction au SQL",
    url: "https://drive.google.com/file/d/17DeVT4A0RmfmZnusZMj53kdObHAJ0fGV/view?usp=drive_link"
  },
  {
    id: 1141,
    title: "B02_M01_010 - Application - Introduction aux bases de données",
    url: "https://drive.google.com/file/d/1R5pxdKYjCdCgDb2-YF6EK1dTgFWEfRM4/view?usp=drive_link"
  },

  // Module 03 : Persistance des Données, SQL Avancé et ORM (PHP / NoSQL)
  {
    id: 1142,
    title: "B02_M03_001 - Création et alimentation de bases de données SQL",
    url: "https://drive.google.com/file/d/1fuFARkulqPOG8UzeWx6KxWh6bA8SmNZX/view?usp=drive_link"
  },
  {
    id: 1143,
    title: "B02_M03_002 - L’interrogation de bases de données SQL",
    url: "https://drive.google.com/file/d/1Lw5Aa-l0uq2m2-m-xPpfymyHF-kctyKI/view?usp=drive_link"
  },
  {
    id: 1144,
    title: "B02_M03_003 - Introduction au passage UML-Relationnel",
    url: "https://drive.google.com/file/d/1GwFVrTDKdn3nPsKE-wr5iOJPm09rLzVG/view?usp=drive_link"
  },
  {
    id: 1145,
    title: "B02_M03_004 - PHP/PDO - accès en lecture/écriture",
    url: "https://drive.google.com/file/d/11eX4vjFAQ4fEJ2KUTasqZfztsCyASiF0/view?usp=drive_link"
  },
  {
    id: 1146,
    title: "B02_M03_005 - Les requêtes SQL",
    url: "https://drive.google.com/file/d/1qXd7nXqRzNFVlFyrHwIMyqpQZGzzJJlK/view?usp=drive_link"
  },
  {
    id: 1147,
    title: "B02_M03_006 - Les fonctions SQL",
    url: "https://drive.google.com/file/d/1bcvAFp1bd6fdnxdFHV7UHwRST19r75Eg/view?usp=drive_link"
  },
  {
    id: 1148,
    title: "B02_M03_007 - Les jointures SQL",
    url: "https://drive.google.com/file/d/1c4rHlylct2rvdvAcH5hdT2VpIY846X_X/view?usp=drive_link"
  },
  {
    id: 1149,
    title: "B02_M03_008 - Gérer les accès des utilisateurs au niveau PHP et BD",
    url: "https://drive.google.com/file/d/1L_kikSmtCdHOoIQ0vVqvxBr0emJbtDMF/view?usp=drive_link"
  },
  {
    id: 1150,
    title: "B02_M03_009 - Découvrir un autre SGBDR - PostgreSQL",
    url: "https://drive.google.com/file/d/1i-effyMGwtf5597kktWNcXbsKO15qtDZ/view?usp=drive_link"
  },
  {
    id: 1151,
    title: "B02_M03_010 - Introduction à MongoDB",
    url: "https://drive.google.com/file/d/1CPlucGasxXjAAHKIrw7Ax-wAhTMkXaBX/view?usp=drive_link"
  },
  {
    id: 1152,
    title: "B02_M03_011 - Découverte d’un ORM PHP",
    url: "https://drive.google.com/file/d/1e4Re_sAT-C3Q8KzwfvzpxT8d8Dog41JF/view?usp=drive_link"
  },
  {
    id: 1153,
    title: "B02_M03_012 - Projet - Créer et administrer une base de données",
    url: "https://drive.google.com/file/d/19Y-_hTNA9Duu5liPdGxIZYVrGW7c16A5/view?usp=drive_link"
  },

  // Module 05 : Sécurisation du Back-End et Gestion des Vulnérabilités
  {
    id: 1154,
    title: "B02_M05_001 - Cadre légal et chiffrement des données",
    url: "https://drive.google.com/file/d/1XRQSe3GMI3nckCdv8OWKRKcJGasF1wG7/view?usp=drive_link"
  },
  {
    id: 1155,
    title: "B02_M05_002 - Failles liées à la BDD côté développement",
    url: "https://drive.google.com/file/d/11y_8N63KXPjaYtza1N5PA1doUAu9J_4u/view?usp=drive_link"
  },
  {
    id: 1156,
    title: "B02_M05_003 - Failles liées à la BDD côté administration",
    url: "https://drive.google.com/file/d/1CD189Y-bbue8Qu667hDBW1Xhpd3ZTd6R/view?usp=drive_link"
  },
  {
    id: 1157,
    title: "B02_M05_004 - Les failles d’include et d’upload",
    url: "https://drive.google.com/file/d/1qiuJuFeNZuHsHWEOBNyqCmlfxUMhp3zD/view?usp=drive_link"
  },
  {
    id: 1158,
    title: "B02_M05_005 - Failles XSS",
    url: "https://drive.google.com/file/d/1SQc0iqzAVaFoA249hirRP3BqfLiGkzPl/view?usp=drive_link"
  },
  {
    id: 1159,
    title: "B02_M05_006 - Attaque par brute force",
    url: "https://drive.google.com/file/d/14x9whOjaO_ZZEPWcCUus5bs8TZ2hUuZd/view?usp=drive_link"
  },

  // Module 06 : Architecture Réseau, Administration Sécurisée et Stratégie de Validation/Test
  {
    id: 1160,
    title: "B02_M06_001 - La connaissance des normes et des standards relatifs aux échanges sécurisés",
    url: "https://drive.google.com/file/d/1w-MmIsOBUo26mPl_omEPp9uph9BKksk6/view?usp=drive_link"
  },
  {
    id: 1161,
    title: "B02_M06_002 - Les recommandations de configuration d’un système GNU/Linux de l’ANSSI",
    url: "https://drive.google.com/file/d/12r8XhVkNOiVVyzqwhG65WKBeMy_Sz5Zr/view?usp=drive_link"
  },
  {
    id: 1162,
    title: "B02_M06_003 - La connaissance des principes de base d’une gestion sécurisée des identités",
    url: "https://drive.google.com/file/d/1uZ6XhZL8ZqsRTYsPS8vgcK8ldd6Xcf_0/view?usp=drive_link"
  },
  {
    id: 1163,
    title: "B02_M06_004 - Introduction à l’architecture TCP-IP",
    url: "https://drive.google.com/file/d/10XaKMgjCxs2gmZKT9E-3VQfJoMK1LAk9/view?usp=drive_link"
  },
  {
    id: 1164,
    title: "B02_M06_005 - La révision des règles d’authentification",
    url: "https://drive.google.com/file/d/1TacvhnW6T3ZLMBqSuD7dNh9N6PUUAhHN/view?usp=drive_link"
  },
  {
    id: 1165,
    title: "B02_M06_006 - Introduction à OpenSSH",
    url: "https://drive.google.com/file/d/1epRf6-PIHQU_-C4blEbeHpP9SPeumcGj/view?usp=drive_link"
  },
  {
    id: 1166,
    title: "B02_M06_007 - Les Niveaux de test",
    url: "https://drive.google.com/file/d/1PqlRfHAioIQmwFg_o20Ttal-_G5fltgh/view?usp=drive_link"
  },
  {
    id: 1167,
    title: "B02_M06_008 - Le test fonctionnel",
    url: "https://drive.google.com/file/d/1VFyUPVNnCUlrFrhl_kNR0-8nbkj-uuaT/view?usp=drive_link"
  },
  {
    id: 1168,
    title: "B02_M06_009 - La mise en place des environnements de test",
    url: "https://drive.google.com/file/d/1DqjjUYjHaLV6BHbh390YKlozaNtRbq0l/view?usp=drive_link"
  },
  {
    id: 1169,
    title: "B02_M06_010 - La mise en place des environnements de pré-production",
    url: "https://drive.google.com/file/d/1pe4jahGxos2Mj-TV53Unop-CET4djqac/view?usp=drive_link"
  },
  {
    id: 1170,
    title: "B02_M06_011 - L’utilisation d’un environnement de test et de pré-production",
    url: "https://drive.google.com/file/d/1NMqZXq8zBobRfBn2TVRRkshpn02GWN9/view?usp=drive_link"
  },
  {
    id: 1171,
    title: "B02_M06_012 - Le test des mises à jour de sécurité avant le déploiement",
    url: "https://drive.google.com/file/d/1_w_RzOuObA6Vw7LwbNn6uM7Ogjn2FYB9/view?usp=drive_link"
  },
  {
    id: 1172,
    title: "B02_M06_013 - La mise à jour de la documentation technique après un test",
    url: "https://drive.google.com/file/d/1TnO-SQncP7KgSK-gTMMNiYKZgHAn9cgG/view?usp=drive_link"
  },

  // Module 07 : Agilité Avancée, Automatisation et Pipeline CI/CD (DevOps)
  {
    id: 1173,
    title: "B02_M07_001 - Les méthodes Agile pour le développement logiciel",
    url: "https://drive.google.com/file/d/1X40OyEPK4uvi2REDSl2eHos7ZqvrgGYi/view?usp=drive_link"
  },
  {
    id: 1174,
    title: "B02_M07_002 - La démarche DevOps",
    url: "https://drive.google.com/file/d/1gsmKVWvDaK8j-W9WcYiYbDZPqjFT02f5/view?usp=drive_link"
  },
  {
    id: 1175,
    title: "B02_M07_003 - Les bases d’un environnement de test",
    url: "https://drive.google.com/file/d/1KxqIXN2sb9oL5GjWnqVs_uoKS_7qJkX2/view?usp=drive_link"
  },
  {
    id: 1176,
    title: "B02_M07_004 - La mise en place de l’intégration continue (CI)",
    url: "https://drive.google.com/file/d/14XNj2cmhQsLmVAC4nUFKOBG3gadrk3DO/view?usp=drive_link"
  },
  {
    id: 1177,
    title: "B02_M07_005 - La mise en place de la livraison ou déploiement continu (CD)",
    url: "https://drive.google.com/file/d/1oK4ZKVe78N2KjWzGxfhJ-lWNWaSvPPi3/view?usp=drive_link"
  },
  {
    id: 1178,
    title: "B02_M07_006 - Application - Préparer un environnement de test",
    url: "https://drive.google.com/file/d/1xpKwK-hkymEPPOptJrTsABHLElubjBlU/view?usp=drive_link"
  }
];

export const dwwmFiches: Fiche[] = rawDwwmItems.map(item => {
  const formattedTitle = item.title.replace(/^B(\d+)_M(\d+)_/, "B_$1_M$2_");
  return {
    id: item.id,
    title: formattedTitle,
    topic: "DWWM",
    action: "Consulter le support d'étude officiel de la formation Web Developer et Mobile.",
    motorsLink: "",
    status4: "A faire",
    coursFile: formattedTitle,
    coursFileUrl: item.url,
    inZoneD: true
  };
});
