export const labels = {
  ro: {
    common: {
      back: "Înapoi",
      loading: "Se încarcă...",
      events: "Evenimente",
      archive: "Arhivă",
      camera: "Camera",
      not_available: "N/A",
      back_to_events: "Înapoi la Evenimente",
      live: "LIVE",
      date: "Data",
      object: "Obiect",
      zone: "Zonă"
    },
    navigation: {
      events: "Evenimente",
      sentinel: "SENTINEL"
    },
    tabs: {
      new: "Noi",
      history: "Istoric"
    },
    actions: {
      details: "Detalii",
      event_details: "Detalii Eveniment",
      retry: "Reîncearcă Conexiunea",
      mark_all_read: "Marchează totul citit",
      go_back_to_cameras: "Înapoi la Camere"
    },
    status: {
      new: "Nou",
      online: "Online",
      offline: "Offline",
      motion_detected: "Mișcare Detectată",
      person_detected: "Persoană Detectată",
      active: "Activ",
      secured: "Sistem Securizat",
      simulated: "Simulat"
    },
    empty_states: {
      up_to_date: "Ești la zi!",
      history_empty: "Istoric gol",
      no_new_events: "Nu există evenimente noi.",
      db_empty: "Baza de date este goală."
    },
    errors: {
      source_unavailable: "Sursă Indisponibilă",
      not_found_desc: "Pagina solicitată nu a putut fi accesată. Verifică conexiunea.",
      no_signal: "Fără semnal",
      error_404: "Err: 404_NOT_FOUND",
      connection_interrupted: "Conexiune întreruptă",
      camera_deleted: "Cameră Ștearsă"
    },
    event_types: {
      person: "Persoană detectată",
      vehicle: "Vehicul identificat",
      motion: "Mișcare suspectă",
      animal: "Animal în zonă",
      unknown: "Activitate necunoscută"
    }
  },
  en: {
    common: {
      back: "Back",
      loading: "Loading...",
      events: "Events",
      archive: "Archive",
      camera: "Camera",
      not_available: "N/A",
      back_to_events: "Back to Events",
      live: "LIVE",
      date: "Date",
      object: "Object",
      zone: "Zone"
    },
    navigation: {
      events: "Events",
      sentinel: "SENTINEL"
    },
    tabs: {
      new: "New",
      history: "History"
    },
    actions: {
      details: "Details",
      event_details: "Event Details",
      retry: "Retry Connection",
      mark_all_read: "Mark all as read",
      go_back_to_cameras: "Back to Cameras"
    },
    status: {
      new: "New",
      online: "Online",
      offline: "Offline",
      motion_detected: "Motion Detected",
      person_detected: "Person Detected",
      active: "Active",
      secured: "System Secured",
      simulated: "Simulated"
    },
    empty_states: {
      up_to_date: "You're up to date!",
      history_empty: "Empty History",
      no_new_events: "No new events found.",
      db_empty: "The event database is empty."
    },
    errors: {
      source_unavailable: "Source Unavailable",
      not_found_desc: "The requested page could not be accessed. Check your connection.",
      no_signal: "No signal",
      error_404: "Err: 404_NOT_FOUND",
      connection_interrupted: "Connection interrupted",
      camera_deleted: "Camera Deleted"
    },
    event_types: {
      person: "Person detected",
      vehicle: "Vehicle identified",
      motion: "Motion detected",
      animal: "Animal in area",
      unknown: "Unknown activity"
    }
  }
};

/**
 * INTERNATIONALIZATION (i18n) DICTIONARY
 * Switch default language by changing the 't' export.
 */

export const getEventLabel = (type: string, lang: 'ro' | 'en' = 'en') => {
  const dictionary = labels[lang].event_types;
  return dictionary[type as keyof typeof dictionary] || labels[lang].event_types.unknown;
};

// DEFAULT LANGUAGE (Change to 'ro' for Romanian users)
export const t = labels.en;