UPDATE equipamentos SET status_id = (SELECT id FROM status_equipamento WHERE nome = 'Ativo')
WHERE status_id = (SELECT id FROM status_equipamento WHERE nome = 'Manutenção')
AND id NOT IN (SELECT equipamento_id FROM ordens_servico);
