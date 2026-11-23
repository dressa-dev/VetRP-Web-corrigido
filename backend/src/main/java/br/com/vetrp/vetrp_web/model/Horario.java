package br.com.vetrp.vetrp_web.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "horario", uniqueConstraints = @UniqueConstraint(columnNames = {"data", "hora"}))
public class Horario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false)
    public LocalDate data;

    @Column(nullable = false)
    public LocalTime hora;

    @Column(nullable = false)
    public boolean liberado = true;
}
