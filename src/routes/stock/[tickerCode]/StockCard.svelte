<script lang="ts">
	export let stock;
</script>

<table>
	<tr>
		<td>code</td><td>{stock.code}</td>
	</tr>
	<tr>
		<td>name</td><td>{stock.name}</td>
	</tr>
	<tr>
		<td>share</td><td>{stock.share}</td>
	</tr>
	<tr>
		<td>price</td><td>{stock.price}</td>
	</tr>
	<tr>
		<td>accountType</td><td>{stock.accountType}</td>
	</tr>
</table>

<style>
	table {
		margin: 0.8em 0;
		border-radius: 0.2em;
		background-color: #dddddd;
		color: #333333;
	}
	td {
		padding: 0.2em 0.5em;
		text-align: left;
	}
</style>
