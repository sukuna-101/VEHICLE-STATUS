# VEHICLE STATUS 2.2 — 4 portais separados

Sistema de garantia com **4 sites distintos** e **a mesma base de dados** (IndexedDB no navegador).

Alterações feitas no **Admin** ou no **Técnico** aparecem automaticamente nos outros portais (mesma origem HTTP).

---

## Portais

| Portal | URL | Senha? | Poderes |
|--------|-----|--------|---------|
| **Admin** | `/admin/` | Sim | Criar, editar todos, excluir, import/export, gerir usuários |
| **Técnico** | `/tecnico/` | Sim | Criar e editar **somente os que ele cadastrou**; **não** pode apagar |
| **Usuário** | `/usuario/` | **Não** | Só visualizar todos os registros |
| **Cliente** | `/cliente/` | Sim | Só visualizar seriais cujo **nome** bate com o vinculado à conta |

Hub de entrada: `/` (escolhe o portal).

---

## Contas demo (com senha)

| Portal | Usuário | Senha |
|--------|---------|-------|
| Admin | `admin` | `admin123` |
| Técnico | `tecnico` | `tec123` |
| Cliente | `cliente` | `cli123` (vê registros “MARCIO BRITO”) |

**Usuário** abre direto, sem login.

O Admin pode criar mais contas de Admin, Técnico ou Cliente (todas com senha). Não existe conta com senha para o papel “Usuário”.

---

## Como executar

```bash
cd VEHICLE-STATUS
python3 -m http.server 8080
```

Abra http://localhost:8080

Os 4 portais precisam do **mesmo host/porta** para compartilhar o IndexedDB.

---

## Regras de status

| Estado | Critério |
|--------|----------|
| LIBERADO | > 30 dias até o vencimento |
| A VENCER | 0 a 30 dias |
| VENCIDO | data já passou |
| REVISÃO | data inválida/ausente |

---

## VEHICLE STATUS 2.2
