ALTER TABLE usuario
    MODIFY COLUMN perfil ENUM('TUTOR','CLINICA','RECEPCAO','VETERINARIO','ADMIN') NOT NULL;

UPDATE usuario SET perfil = 'ADMIN' WHERE perfil = 'CLINICA';

ALTER TABLE usuario
    MODIFY COLUMN perfil ENUM('TUTOR','RECEPCAO','VETERINARIO','ADMIN') NOT NULL,
    ADD COLUMN cep VARCHAR(9) NULL,
    ADD COLUMN rua VARCHAR(150) NULL,
    ADD COLUMN numero VARCHAR(20) NULL,
    ADD COLUMN complemento VARCHAR(100) NULL,
    ADD COLUMN bairro VARCHAR(100) NULL,
    ADD COLUMN cidade VARCHAR(100) NULL,
    ADD COLUMN uf CHAR(2) NULL,
    ADD COLUMN crmv_uf CHAR(2) NULL,
    ADD COLUMN especialidade VARCHAR(100) NULL;

CREATE TABLE horario (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    data DATE NOT NULL,
    hora TIME NOT NULL,
    liberado BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uk_horario_data_hora UNIQUE (data, hora)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO horario (data, hora, liberado)
SELECT DISTINCT DATE(data_hora), TIME(data_hora), TRUE
FROM agendamento;

ALTER TABLE agendamento
    ADD COLUMN horario_id BIGINT NULL,
    ADD COLUMN profissional VARCHAR(120) NULL;

UPDATE agendamento a
JOIN horario h
  ON h.data = DATE(a.data_hora)
 AND h.hora = TIME(a.data_hora)
SET a.horario_id = h.id;

ALTER TABLE agendamento
    MODIFY COLUMN horario_id BIGINT NOT NULL,
    ADD CONSTRAINT fk_agendamento_horario
        FOREIGN KEY (horario_id) REFERENCES horario(id);
