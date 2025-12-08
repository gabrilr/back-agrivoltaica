-- Script de creación de tablas para el proyecto Agrivoltaica

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    idusuario INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(255) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) NOT NULL
);

-- Tabla de Cultivos
CREATE TABLE IF NOT EXISTS cultivos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    temp FLOAT NOT NULL,
    iluminosidad FLOAT NOT NULL,
    humedad_suelo FLOAT NOT NULL,
    humedad_aire FLOAT NOT NULL
);

-- Tabla de Parcelas
CREATE TABLE IF NOT EXISTS parcelas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    mac VARCHAR(255) NOT NULL UNIQUE,
    idusuario INT NOT NULL,
    FOREIGN KEY (idusuario) REFERENCES usuarios(idusuario) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla de Datos de Sensores
CREATE TABLE IF NOT EXISTS sensor_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mac VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    iluminacion FLOAT,
    humedad_suelo FLOAT,
    humedad_aire FLOAT,
    temp FLOAT,
    FOREIGN KEY (mac) REFERENCES parcelas(mac) ON DELETE CASCADE ON UPDATE CASCADE
);
