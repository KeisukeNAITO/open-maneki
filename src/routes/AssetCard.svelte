<script lang="ts">
	export let asset;
</script>

<table>
    <tr>
        <td>stockId</td><td>{asset.stockId}</td>
    </tr>
    <tr>
        <td>code</td><td>{asset.code}</td>
    </tr>
    <tr>
        <td>name</td><td>{asset.name}</td>
    </tr>
    <tr>
        <td>share</td><td>{asset.share}</td>
    </tr>
    <tr>
        <td>price</td><td>{asset.price}</td>
    </tr>
    <tr>
        <td>dividendId</td><td>{asset.dividendId || '-'}</td>
    </tr>
    <tr>
        <td>amount</td><td>{asset.amount || '-'}</td>
    </tr>
    <tr>
        <td><a href="/stock/{asset.code}">+</a></td>
    </tr>    
</table>

<style>
	table {
		margin: 0.8em 0;
		border-radius: 0.2em;
		background-color: #dddddd;
		color:#333333;
	}
	td {
		padding: 0.2em 0.5em;
		text-align: left;
	}
</style>
