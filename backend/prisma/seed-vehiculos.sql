INSERT INTO vehiculos (id, marca, modelo, anio, placa, tipo, capacidad_pasajeros, caracteristicas, imagenes, seguro_incluido, activo, proveedor_id, created_at, updated_at) VALUES

-- Carlos (finca.loma)
(gen_random_uuid(), 'Toyota', 'Land Cruiser Prado', 2025, 'CHI-1001', 'SUV', 7, '{"4x4","Aire acondicionado","GPS","Bluetooth","Camara reversa","Asientos de cuero"}', '{}', true, true, '02ffba96-e3e7-4364-bc4b-22c0946532b0', NOW(), NOW()),
(gen_random_uuid(), 'Ford', 'Ranger Wildtrak', 2024, 'CHI-2002', 'PICKUP', 5, '{"4x4","Doble cabina","A/C","Barra antivuelco","Cajuela con cobertor","USB"}', '{}', true, true, '02ffba96-e3e7-4364-bc4b-22c0946532b0', NOW(), NOW()),

-- Maria (aventura.chiriqui)
(gen_random_uuid(), 'Mercedes-Benz', 'Sprinter 515', 2023, 'CHI-3003', 'VAN', 15, '{"Aire acondicionado","Microfono","Pantalla TV","WiFi","Portaequipaje","Asientos reclinables"}', '{}', true, true, 'a1516bbc-5bb7-4f45-983a-e20a91be7be4', NOW(), NOW()),
(gen_random_uuid(), 'Mitsubishi', 'Montero Sport', 2025, 'CHI-4004', 'SUV', 7, '{"4x4","A/C","GPS","7 asientos","Camara 360","Cargador inalambrico"}', '{}', true, true, 'a1516bbc-5bb7-4f45-983a-e20a91be7be4', NOW(), NOW()),
(gen_random_uuid(), 'Suzuki', 'Jimny', 2024, 'CHI-5005', 'SUV', 4, '{"4x4","Compacto","A/C","Ideal para senderos","Bajo consumo","Bluetooth"}', '{}', false, true, 'a1516bbc-5bb7-4f45-983a-e20a91be7be4', NOW(), NOW()),

-- Roberto (agencia.panama)
(gen_random_uuid(), 'Toyota', 'HiAce Commuter', 2024, 'PAN-6006', 'MINIBUS', 14, '{"Aire acondicionado","Microfono","WiFi","USB por asiento","Cortinas","Portaequipaje amplio"}', '{}', true, true, 'd145bc4c-6795-4b02-96a1-20b8cc16486a', NOW(), NOW()),
(gen_random_uuid(), 'Hyundai', 'Tucson', 2025, 'PAN-7007', 'SUV', 5, '{"A/C","GPS","Apple CarPlay","Camara reversa","Asientos calefactables","Techo panoramico"}', '{}', true, true, 'd145bc4c-6795-4b02-96a1-20b8cc16486a', NOW(), NOW()),
(gen_random_uuid(), 'Hino', 'Dutro Bus', 2023, 'PAN-8008', 'BUS', 30, '{"Aire acondicionado","Microfono","2 pantallas TV","Bano a bordo","WiFi","Compartimento de equipaje"}', '{}', true, true, 'd145bc4c-6795-4b02-96a1-20b8cc16486a', NOW(), NOW()),

-- Klaudia
(gen_random_uuid(), 'Kia', 'Carnival', 2024, 'COC-9009', 'VAN', 8, '{"A/C tri-zona","Puertas corredizas electricas","Pantalla entretenimiento","WiFi","USB","Asientos plegables"}', '{}', true, true, '599d3b1e-5f84-419f-af9f-cfbbe047e1aa', NOW(), NOW()),
(gen_random_uuid(), 'Toyota', 'Corolla Cross', 2025, 'COC-1010', 'SEDAN', 5, '{"A/C","GPS","Hibrido","Bajo consumo","Apple CarPlay","Camara reversa"}', '{}', true, true, '599d3b1e-5f84-419f-af9f-cfbbe047e1aa', NOW(), NOW());
