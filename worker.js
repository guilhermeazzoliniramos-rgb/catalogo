export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API: listar produtos
    if (url.pathname === "/api/produtos" && request.method === "GET") {
      try {
        const { results } = await env.DB
          .prepare("SELECT * FROM produtos ORDER BY id DESC")
          .all();

        return Response.json(results);
      } catch (error) {
        return Response.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }

    // API: criar produto
    if (url.pathname === "/api/produtos" && request.method === "POST") {
      try {
        const produto = await request.json();

        if (!produto.nome) {
          return Response.json(
            { error: "Nome obrigatório" },
            { status: 400 }
          );
        }

        const result = await env.DB
          .prepare(`
            INSERT INTO produtos
            (nome, codigo, categoria, marca, descricao, especificacoes, imagem)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(
            produto.nome,
            produto.codigo || "",
            produto.categoria || "",
            produto.marca || "",
            produto.descricao || "",
            produto.especificacoes || "",
            produto.imagem || ""
          )
          .run();

        return Response.json({
          id: result.meta.last_row_id,
          ...produto
        });
      } catch (error) {
        return Response.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }

    // API: editar produto
    if (
      url.pathname.startsWith("/api/produtos/") &&
      request.method === "PUT"
    ) {
      try {
        const id = url.pathname.split("/").pop();
        const produto = await request.json();

        await env.DB
          .prepare(`
            UPDATE produtos SET
              nome = ?,
              codigo = ?,
              categoria = ?,
              marca = ?,
              descricao = ?,
              especificacoes = ?,
              imagem = ?
            WHERE id = ?
          `)
          .bind(
            produto.nome,
            produto.codigo || "",
            produto.categoria || "",
            produto.marca || "",
            produto.descricao || "",
            produto.especificacoes || "",
            produto.imagem || "",
            id
          )
          .run();

        return Response.json({ ok: true });
      } catch (error) {
        return Response.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }

    // API: excluir produto
    if (
      url.pathname.startsWith("/api/produtos/") &&
      request.method === "DELETE"
    ) {
      try {
        const id = url.pathname.split("/").pop();

        await env.DB
          .prepare("DELETE FROM produtos WHERE id = ?")
          .bind(id)
          .run();

        return Response.json({ ok: true });
      } catch (error) {
        return Response.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }

    // Servir o site
    return env.ASSETS.fetch(request);
  }
};
