import {
    Get,
    Post,
    Put,
    Delete,
    Status,
    Controller,
    BaseController,
    Validate,
    Inject
} from "./../deps.ts";
import Items from "./items_dto.ts";
import ItemsService from "./items_service.ts";

@Controller("/items")
class ItemsController extends BaseController {

    @Inject(ItemsService)
    private readonly itemsService!: ItemsService;

    @Get()
    findAll() {
        return this.itemsService.findAll();
    }

    @Get("/search")
    search() {
        const { text } = this.request.query;
        return this.itemsService.search(text);
    }

    @Get("/:id")
    findById() {
        const { id } = this.request.params;
        return this.itemsService.findById(Number(id));
    }

    @Status(201)
    @Validate(Items)
    @Post()
    save() {
        const body = this.request.parsedBody as Items;
        return this.itemsService.save(body);
    }

    @Validate(Items)
    @Put("/:id")
    update() {
        const { id } = this.request.params;
        const body = this.request.parsedBody as Items;
        return this.itemsService.update(Number(id), body);
    }

    @Delete("/:id")
    destroy() {
        const { id } = this.request.params;
        return this.itemsService.destroy(Number(id));
    }
}

export default ItemsController;