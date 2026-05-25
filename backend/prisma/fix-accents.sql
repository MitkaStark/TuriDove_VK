-- Fix hospedajes names
UPDATE hospedajes SET nombre = REPLACE(nombre, 'Cabanas', E'Caba\u00f1as') WHERE nombre LIKE '%Cabanas%';
UPDATE hospedajes SET nombre = REPLACE(nombre, 'Volcan', E'Volc\u00e1n') WHERE nombre LIKE '%Volcan%';
UPDATE hospedajes SET nombre = REPLACE(nombre, 'Peninsula', E'Pen\u00ednsula') WHERE nombre LIKE '%Peninsula%';

-- Fix hospedajes descriptions
UPDATE hospedajes SET descripcion = REPLACE(descripcion, 'Panama', E'Panam\u00e1') WHERE descripcion LIKE '%Panama%';
UPDATE hospedajes SET descripcion = REPLACE(descripcion, 'organicos', E'org\u00e1nicos') WHERE descripcion LIKE '%organicos%';
UPDATE hospedajes SET descripcion = REPLACE(descripcion, 'ecologico', E'ecol\u00f3gico') WHERE descripcion LIKE '%ecologico%';
UPDATE hospedajes SET descripcion = REPLACE(descripcion, 'panoramica', E'panor\u00e1mica') WHERE descripcion LIKE '%panoramica%';
UPDATE hospedajes SET descripcion = REPLACE(descripcion, 'autentica', E'aut\u00e9ntica') WHERE descripcion LIKE '%autentica%';
UPDATE hospedajes SET descripcion = REPLACE(descripcion, 'indigena', E'ind\u00edgena') WHERE descripcion LIKE '%indigena%';
UPDATE hospedajes SET descripcion = REPLACE(descripcion, 'artesania', E'artesan\u00eda') WHERE descripcion LIKE '%artesania%';
UPDATE hospedajes SET descripcion = REPLACE(descripcion, 'Pacifico', E'Pac\u00edfico') WHERE descripcion LIKE '%Pacifico%';
UPDATE hospedajes SET descripcion = REPLACE(descripcion, 'cabanas', E'caba\u00f1as') WHERE descripcion LIKE '%cabanas%';
UPDATE hospedajes SET descripcion = REPLACE(descripcion, 'panamena', E'paname\u00f1a') WHERE descripcion LIKE '%panamena%';
UPDATE hospedajes SET descripcion = REPLACE(descripcion, 'panameno', E'paname\u00f1o') WHERE descripcion LIKE '%panameno%';
UPDATE hospedajes SET descripcion = REPLACE(descripcion, 'botanico', E'bot\u00e1nico') WHERE descripcion LIKE '%botanico%';
UPDATE hospedajes SET descripcion = REPLACE(descripcion, 'montana', E'monta\u00f1a') WHERE descripcion LIKE '%montana%';

-- Fix habitaciones names
UPDATE habitaciones SET nombre = REPLACE(nombre, 'Habitacion', E'Habitaci\u00f3n') WHERE nombre LIKE '%Habitacion%';
UPDATE habitaciones SET nombre = REPLACE(nombre, 'Cabana', E'Caba\u00f1a') WHERE nombre LIKE '%Cabana%';

-- Fix habitaciones descriptions
UPDATE habitaciones SET descripcion = REPLACE(descripcion, 'Volcan', E'Volc\u00e1n') WHERE descripcion LIKE '%Volcan%';
UPDATE habitaciones SET descripcion = REPLACE(descripcion, 'Cabana', E'Caba\u00f1a') WHERE descripcion LIKE '%Cabana%';
UPDATE habitaciones SET descripcion = REPLACE(descripcion, 'cabana', E'caba\u00f1a') WHERE descripcion LIKE '%cabana%';
UPDATE habitaciones SET descripcion = REPLACE(descripcion, 'intima', E'\u00edntima') WHERE descripcion LIKE '%intima%';
UPDATE habitaciones SET descripcion = REPLACE(descripcion, 'rustica', E'r\u00fastica') WHERE descripcion LIKE '%rustica%';
UPDATE habitaciones SET descripcion = REPLACE(descripcion, 'panoramica', E'panor\u00e1mica') WHERE descripcion LIKE '%panoramica%';
UPDATE habitaciones SET descripcion = REPLACE(descripcion, 'tematica', E'tem\u00e1tica') WHERE descripcion LIKE '%tematica%';
UPDATE habitaciones SET descripcion = REPLACE(descripcion, 'degustacion', E'degustaci\u00f3n') WHERE descripcion LIKE '%degustacion%';
UPDATE habitaciones SET descripcion = REPLACE(descripcion, 'Pacifico', E'Pac\u00edfico') WHERE descripcion LIKE '%Pacifico%';
UPDATE habitaciones SET descripcion = REPLACE(descripcion, 'geodesico', E'geod\u00e9sico') WHERE descripcion LIKE '%geodesico%';
UPDATE habitaciones SET descripcion = REPLACE(descripcion, 'Bano', E'Ba\u00f1o') WHERE descripcion LIKE '%Bano%';

-- Fix habitaciones amenidades
UPDATE habitaciones SET amenidades = array_replace(amenidades, 'Bano privado', E'Ba\u00f1o privado');
UPDATE habitaciones SET amenidades = array_replace(amenidades, 'Bano compartido', E'Ba\u00f1o compartido');
UPDATE habitaciones SET amenidades = array_replace(amenidades, 'Bano con tina', E'Ba\u00f1o con tina');
UPDATE habitaciones SET amenidades = array_replace(amenidades, 'Bano ecologico', E'Ba\u00f1o ecol\u00f3gico');
UPDATE habitaciones SET amenidades = array_replace(amenidades, 'Jardin botanico', E'Jard\u00edn bot\u00e1nico');
UPDATE habitaciones SET amenidades = array_replace(amenidades, 'Jardin interior', E'Jard\u00edn interior');
UPDATE habitaciones SET amenidades = array_replace(amenidades, 'Ventilacion natural', E'Ventilaci\u00f3n natural');
UPDATE habitaciones SET amenidades = array_replace(amenidades, 'Calefaccion', E'Calefacci\u00f3n');
UPDATE habitaciones SET amenidades = array_replace(amenidades, 'Bioconstruccion', E'Bioconstrucci\u00f3n');

-- Fix actividades descriptions
UPDATE actividades SET descripcion = REPLACE(descripcion, 'Panama', E'Panam\u00e1') WHERE descripcion LIKE '%Panama%';
UPDATE actividades SET descripcion = REPLACE(descripcion, 'degustacion', E'degustaci\u00f3n') WHERE descripcion LIKE '%degustacion%';
UPDATE actividades SET descripcion = REPLACE(descripcion, 'catacion', E'cataci\u00f3n') WHERE descripcion LIKE '%catacion%';
UPDATE actividades SET descripcion = REPLACE(descripcion, 'Navegacion', E'Navegaci\u00f3n') WHERE descripcion LIKE '%Navegacion%';
UPDATE actividades SET descripcion = REPLACE(descripcion, 'artesania', E'artesan\u00eda') WHERE descripcion LIKE '%artesania%';
UPDATE actividades SET descripcion = REPLACE(descripcion, 'montana', E'monta\u00f1a') WHERE descripcion LIKE '%montana%';
UPDATE actividades SET descripcion = REPLACE(descripcion, 'endemicas', E'end\u00e9micas') WHERE descripcion LIKE '%endemicas%';
UPDATE actividades SET descripcion = REPLACE(descripcion, 'aereas', E'a\u00e9reas') WHERE descripcion LIKE '%aereas%';
UPDATE actividades SET descripcion = REPLACE(descripcion, 'canon', E'ca\u00f1\u00f3n') WHERE descripcion LIKE '%canon %';
UPDATE actividades SET descripcion = REPLACE(descripcion, 'ordeno', E'orde\u00f1o') WHERE descripcion LIKE '%ordeno%';
UPDATE actividades SET descripcion = REPLACE(descripcion, 'lena', E'le\u00f1a') WHERE descripcion LIKE '%lena%';
UPDATE actividades SET descripcion = REPLACE(descripcion, 'elaboracion', E'elaboraci\u00f3n') WHERE descripcion LIKE '%elaboracion%';
UPDATE actividades SET nombre = REPLACE(nombre, 'Ordeno', E'Orde\u00f1o') WHERE nombre LIKE '%Ordeno%';
UPDATE actividades SET nombre = REPLACE(nombre, 'Volcan', E'Volc\u00e1n') WHERE nombre LIKE '%Volcan%';

-- Fix transfers
UPDATE transfers SET nombre = REPLACE(nombre, 'Panoramico', E'Panor\u00e1mico') WHERE nombre LIKE '%Panoramico%';
UPDATE transfers SET nombre = REPLACE(nombre, 'Panama', E'Panam\u00e1') WHERE nombre LIKE '%Panama%';
UPDATE transfers SET nombre = REPLACE(nombre, 'Peninsula', E'Pen\u00ednsula') WHERE nombre LIKE '%Peninsula%';
UPDATE transfers SET nombre = REPLACE(nombre, 'Penonome', E'Penonom\u00e9') WHERE nombre LIKE '%Penonome%';
UPDATE transfers SET descripcion = REPLACE(descripcion, 'Panama', E'Panam\u00e1') WHERE descripcion LIKE '%Panama%';
UPDATE transfers SET descripcion = REPLACE(descripcion, 'escenica', E'esc\u00e9nica') WHERE descripcion LIKE '%escenica%';
UPDATE transfers SET descripcion = REPLACE(descripcion, 'bilingue', E'biling\u00fce') WHERE descripcion LIKE '%bilingue%';
UPDATE transfers SET descripcion = REPLACE(descripcion, 'basicos', E'b\u00e1sicos') WHERE descripcion LIKE '%basicos%';
UPDATE transfers SET descripcion = REPLACE(descripcion, 'panoramico', E'panor\u00e1mico') WHERE descripcion LIKE '%panoramico%';
UPDATE transfers SET descripcion = REPLACE(descripcion, 'montana', E'monta\u00f1a') WHERE descripcion LIKE '%montana%';

-- Fix hospedajes amenidades
UPDATE hospedajes SET amenidades = array_replace(amenidades, 'Jardin', E'Jard\u00edn') WHERE 'Jardin' = ANY(amenidades);
UPDATE hospedajes SET amenidades = array_replace(amenidades, 'Ordeno', E'Orde\u00f1o') WHERE 'Ordeno' = ANY(amenidades);
