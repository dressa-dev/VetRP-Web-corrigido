package br.com.vetrp.vetrp_web.model;

import jakarta.persistence.*;

@Entity
@Table(name = "usuario")
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "nome", nullable = false, length = 120)
    public String nome;

    @Column(name = "login", nullable = false, unique = true, length = 120)
    public String email;

    @Column(name = "senha", nullable = false, length = 100)
    public String senhaHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "perfil", nullable = false)
    public Perfil perfil = Perfil.TUTOR;

    @Column(name = "telefone", length = 20)
    public String telefone;

    @Column(name = "cep", length = 9)
    public String cep;

    @Column(name = "rua", length = 150)
    public String rua;

    @Column(name = "numero", length = 20)
    public String numero;

    @Column(name = "complemento", length = 100)
    public String complemento;

    @Column(name = "bairro", length = 100)
    public String bairro;

    @Column(name = "cidade", length = 100)
    public String cidade;

    @Column(name = "uf", length = 2)
    public String uf;

    @Column(name = "crmv", length = 30)
    public String crmv;

    @Column(name = "crmv_uf", length = 2)
    public String crmvUf;

    @Column(name = "especialidade", length = 100)
    public String especialidade;

    @Column(name = "ativo", nullable = false)
    public boolean ativo = true;
}
