CREATE TABLE usuario (
                         id          BIGINT AUTO_INCREMENT PRIMARY KEY,
                         login       VARCHAR(120) NOT NULL UNIQUE,
                         senha       VARCHAR(100) NOT NULL,
                         perfil      ENUM('TUTOR','CLINICA') NOT NULL,
                         nome        VARCHAR(120) NOT NULL,
                         ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
                         criado_em   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE animal (
                        id              BIGINT AUTO_INCREMENT PRIMARY KEY,
                        tutor_id        BIGINT       NOT NULL,
                        nome            VARCHAR(80)  NOT NULL,
                        especie         VARCHAR(30)  NOT NULL,
                        raca            VARCHAR(60),
                        genero          VARCHAR(10),
                        data_nascimento DATE,
                        peso_kg         DECIMAL(5,2),
                        cor             VARCHAR(40),
                        foto            VARCHAR(255),
                        criado_em       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        CONSTRAINT fk_animal_tutor FOREIGN KEY (tutor_id) REFERENCES usuario(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE agendamento (
                             id              BIGINT AUTO_INCREMENT PRIMARY KEY,
                             animal_id       BIGINT      NOT NULL,
                             veterinario_id  BIGINT,
                             tipo            ENUM('CONSULTA','EXAME') NOT NULL,
                             especialidade   VARCHAR(60),
                             descricao       VARCHAR(200),
                             data_hora       DATETIME    NOT NULL,
                             status          ENUM('AGENDADO','REALIZADO','CANCELADO') NOT NULL DEFAULT 'AGENDADO',
                             criado_em       TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
                             CONSTRAINT fk_agend_animal FOREIGN KEY (animal_id) REFERENCES animal(id),
                             CONSTRAINT fk_agend_vet    FOREIGN KEY (veterinario_id) REFERENCES usuario(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_agend_data ON agendamento(data_hora);