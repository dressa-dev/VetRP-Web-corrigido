package br.com.vetrp.vetrp_web.repository;

import br.com.vetrp.vetrp_web.model.Animal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AnimalRepository extends JpaRepository<Animal, Long> {
    List<Animal> findByTutorIdAndAtivoTrue(Long tutorId);
}
