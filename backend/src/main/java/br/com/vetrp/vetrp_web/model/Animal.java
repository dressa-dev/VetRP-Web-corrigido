package br.com.vetrp.vetrp_web.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "animal")
public class Animal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "tutor_id", nullable = false)
    public Usuario tutor;

    @Column(nullable = false, length = 80)
    public String nome;

    @Column(nullable = false, length = 30)
    public String especie;

    @Column(length = 60)
    public String raca;

    @Column(length = 10)
    public String sexo;

    @Column(name = "data_nascimento")
    public LocalDate nascimento;

    @Column(name = "peso_kg")
    public Double peso;

    @Column(length = 40)
    public String pelagem;

    @Column(length = 500)
    public String observacoes;

    @Column(length = 255)
    public String foto;

    @Column(nullable = false)
    public boolean ativo = true;
}
