INSERT INTO transfers (id, nombre, tipo, origen, destino, descripcion, distancia_km, duracion_estimada, activo, proveedor_id, created_at, updated_at) VALUES

-- Carlos (finca.loma) - Chiriqui
(gen_random_uuid(), 'Aeropuerto David - Boquete Express', 'AEROPUERTO', 'Aeropuerto Enrique Malek, David', 'Boquete Centro', 'Transfer directo desde el aeropuerto de David hasta tu hospedaje en Boquete. Vehiculo con aire acondicionado y conductor bilingue.', 45, '50 min', true, '02ffba96-e3e7-4364-bc4b-22c0946532b0', NOW(), NOW()),

(gen_random_uuid(), 'Boquete - Cerro Punta / Guadalupe', 'PUNTO_A_PUNTO', 'Boquete Centro', 'Cerro Punta - Guadalupe', 'Traslado por la carretera escenica de las tierras altas con paradas opcionales en miradores y jardines de flores.', 35, '45 min', true, '02ffba96-e3e7-4364-bc4b-22c0946532b0', NOW(), NOW()),

(gen_random_uuid(), 'Tour Circuito Cafetero Boquete', 'TOUR', 'Boquete Centro (hotel)', 'Boquete Centro (hotel)', 'Recorrido por las principales fincas cafeteras de Boquete: Kotowa, Ruiz y Lerida. Incluye paradas en miradores del Volcan Baru.', 60, '4 horas', true, '02ffba96-e3e7-4364-bc4b-22c0946532b0', NOW(), NOW()),

-- Maria (aventura.chiriqui) - Chiriqui
(gen_random_uuid(), 'David - Playa Las Lajas', 'PUNTO_A_PUNTO', 'David Centro / Hoteles', 'Playa Las Lajas', 'Transfer a la playa mas larga de Panama (14 km de arena). Ideal para familias y amantes del sol.', 75, '1h 15min', true, 'a1516bbc-5bb7-4f45-983a-e20a91be7be4', NOW(), NOW()),

(gen_random_uuid(), 'Boquete - Frontera Paso Canoas', 'PUNTO_A_PUNTO', 'Boquete Centro', 'Paso Canoas (frontera Costa Rica)', 'Traslado a la frontera con Costa Rica. Asistencia con tramites migratorios basicos.', 85, '1h 30min', true, 'a1516bbc-5bb7-4f45-983a-e20a91be7be4', NOW(), NOW()),

(gen_random_uuid(), 'Tour Sendero de Los Quetzales', 'TOUR', 'Boquete Centro', 'Cerro Punta (o viceversa)', 'Transporte para el famoso Sendero de los Quetzales: te dejamos en un extremo y te recogemos en el otro. Incluye mapa del sendero.', 40, '5 horas (sendero)', true, 'a1516bbc-5bb7-4f45-983a-e20a91be7be4', NOW(), NOW()),

-- Roberto (agencia.panama) - Nacional
(gen_random_uuid(), 'Aeropuerto Tocumen - Ciudad de Panama', 'AEROPUERTO', 'Aeropuerto Internacional de Tocumen', 'Ciudad de Panama / Casco Viejo', 'Transfer premium desde Tocumen a cualquier hotel de la ciudad. Vehiculo ejecutivo con WiFi y agua de cortesia.', 35, '40 min', true, 'd145bc4c-6795-4b02-96a1-20b8cc16486a', NOW(), NOW()),

(gen_random_uuid(), 'Ciudad de Panama - San Blas (Guna Yala)', 'PUNTO_A_PUNTO', 'Ciudad de Panama', 'Puerto de Carti, Guna Yala', 'Transporte en 4x4 por la carretera de la Llana hasta el puerto de embarque a las islas de San Blas. Salida 5:00 AM.', 150, '2h 30min', true, 'd145bc4c-6795-4b02-96a1-20b8cc16486a', NOW(), NOW()),

(gen_random_uuid(), 'Tour Canal de Panama y Esclusas', 'TOUR', 'Hotel en Ciudad de Panama', 'Hotel en Ciudad de Panama', 'Tour completo por las Esclusas de Miraflores, Causeway de Amador, Casco Viejo y miradores del Canal de Panama.', 45, '5 horas', true, 'd145bc4c-6795-4b02-96a1-20b8cc16486a', NOW(), NOW()),

(gen_random_uuid(), 'Ciudad de Panama - Pedasi (Azuero)', 'PUNTO_A_PUNTO', 'Ciudad de Panama', 'Pedasi, Los Santos', 'Transfer directo a la Peninsula de Azuero. Parada opcional en Chitre para almuerzo.', 280, '4h 30min', true, 'd145bc4c-6795-4b02-96a1-20b8cc16486a', NOW(), NOW()),

-- Klaudia - Varias zonas
(gen_random_uuid(), 'Penonome - Parque Nacional El Cope', 'PUNTO_A_PUNTO', 'Penonome Centro', 'Parque Nacional Omar Torrijos (El Cope)', 'Transfer en 4x4 por camino de montana hasta la entrada del parque. Conductor conocedor de la zona.', 28, '45 min', true, '599d3b1e-5f84-419f-af9f-cfbbe047e1aa', NOW(), NOW()),

(gen_random_uuid(), 'Tour Peninsula de Azuero Completo', 'TOUR', 'Chitre (hotel)', 'Chitre (hotel)', 'Recorrido completo por la Peninsula de Azuero: Chitre, Los Santos, Las Tablas, Pedasi, Playa Venao. Incluye paradas en talleres de polleras y alfareria.', 200, '8 horas', true, '599d3b1e-5f84-419f-af9f-cfbbe047e1aa', NOW(), NOW());
