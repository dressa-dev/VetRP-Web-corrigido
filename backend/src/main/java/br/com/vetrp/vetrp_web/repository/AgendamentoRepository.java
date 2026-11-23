package br.com.vetrp.vetrp_web.repository;

import br.com.vetrp.vetrp_web.model.Agendamento;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {
    List<Agendamento> findByAnimalTutorId(Long tutorId);
    List<Agendamento> findByHorarioIdAndStatus(Long horarioId, String status);
}
