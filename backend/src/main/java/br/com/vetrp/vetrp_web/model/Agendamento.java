package br.com.vetrp.vetrp_web.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "agendamento")
public class Agendamento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "animal_id", nullable = false)
    public Animal animal;

    @ManyToOne(optional = false)
    @JoinColumn(name = "horario_id", nullable = false)
    public Horario horario;

    @Column(name = "tipo", nullable = false, length = 20)
    public String tipo;

    @Column(name = "servico", nullable = false, length = 80)
    public String servico;

    @Column(name = "data_hora", nullable = false)
    public LocalDateTime dataHora;

    @Column(name = "status", nullable = false, length = 20)
    public String status = "AGENDADO";

    @Column(name = "profissional", length = 120)
    public String profissional;

    @Column(name = "observacoes", length = 500)
    public String motivo;

    @Column(name = "duracao_min", nullable = false)
    public Integer duracaoMin = 30;
}
