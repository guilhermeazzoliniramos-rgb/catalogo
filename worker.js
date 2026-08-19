export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================================================
    // AUTENTICAÇÃO DO ADMINISTRADOR
    // =========================================================

    function verificarAdmin(request) {
      const auth = request.headers.get("Authorization");

      if (!auth || !auth.startsWith("Basic ")) {
        return false;
      }

      try {
        const decoded = atob(auth.slice(6));
        const [usuario, senha] = decoded.split(":");

        return (
          usuario === "admin" &&
          senha === env.ADMIN_PASSWORD
        );
      } catch {
        return false;
      }
    }

    function respostaLogin() {
      return new Response("Acesso restrito. Digite a senha do administrador.", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Administrador"',
          "Content-Type": "text/plain; charset=utf-8"
        }
      });
    }

    // =========================================================
    // PROTEGER ÁREA DO ADMIN
    // =========================================================

    if (
      url.pathname === "/admin" ||
      url.pathname === "/admin/" ||
      url.pathname === "/admin.html"
    ) {
      if (!verificarAdmin(request)) {
        return respostaLogin();
      }
    }

    // =========================================================
    // API: LISTAR PRODUTOS
    // Essa parte continua pública para o catálogo
    // =========================================================

    if (
      url.pathname === "/api/produtos" &&
      request.method === "GET"
    ) {
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

    // =========================================================
    // PROTEGER ALTERAÇÕES NO BANCO
    // =========================================================

    if (
      url.pathname === "/api/produtos" &&
      request.method === "POST"
    ) {
      if (!verificarAdmin(request)) {
        return respostaLogin();
      }

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

    // =========================================================
    // API: EDITAR PRODUTO
    // =========================================================

    if (
      url.pathname.startsWith("/api/produtos/") &&
      request.method === "PUT"
    ) {
      if (!verificarAdmin(request)) {
        return respostaLogin();
      }

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

    // =========================================================
    // API: EXCLUIR PRODUTO
    // =========================================================

    if (
      url.pathname.startsWith("/api/produtos/") &&
      request.method === "DELETE"
    ) {
      if (!verificarAdmin(request)) {
        return respostaLogin();
      }

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

    // =========================================================
    // SERVIR O SITE
    // =========================================================

    return env.ASSETS.fetch(request);
  }
};
