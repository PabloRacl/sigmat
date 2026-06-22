DELETE FROM transferencias WHERE solicitante_id IN (SELECT id FROM usuarios WHERE login ILIKE '%teste%' OR nome ILIKE '%teste%');
DELETE FROM alteracoes_pendentes WHERE solicitante_id IN (SELECT id FROM usuarios WHERE login ILIKE '%teste%' OR nome ILIKE '%teste%');
DELETE FROM ordens_servico WHERE solicitante_id IN (SELECT id FROM usuarios WHERE login ILIKE '%teste%' OR nome ILIKE '%teste%');
DELETE FROM log_operacoes WHERE usuario_id IN (SELECT id FROM usuarios WHERE login ILIKE '%teste%' OR nome ILIKE '%teste%');
DELETE FROM refresh_tokens WHERE usuario_id IN (SELECT id FROM usuarios WHERE login ILIKE '%teste%' OR nome ILIKE '%teste%');
DELETE FROM usuario_secoes WHERE usuario_id IN (SELECT id FROM usuarios WHERE login ILIKE '%teste%' OR nome ILIKE '%teste%');
DELETE FROM usuario_tipos_equipamento WHERE usuario_id IN (SELECT id FROM usuarios WHERE login ILIKE '%teste%' OR nome ILIKE '%teste%');
DELETE FROM usuarios WHERE login ILIKE '%teste%' OR nome ILIKE '%teste%';
